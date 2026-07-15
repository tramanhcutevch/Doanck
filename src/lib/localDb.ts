type Primitive = string | number | boolean | null;
type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };

type StoredDoc = {
  id: string;
  [key: string]: JsonValue;
};

type CollectionRef = {
  kind: "collection";
  name: string;
};

type DocRef = {
  kind: "doc";
  collection: string;
  id: string;
};

type Constraint =
  | { type: "where"; field: string; op: "=="; value: JsonValue }
  | { type: "orderBy"; field: string; direction: "asc" | "desc" }
  | { type: "limit"; count: number };

type QueryRef = {
  kind: "query";
  collection: string;
  constraints: Constraint[];
};

type SnapshotDoc = {
  id: string;
  data: () => Record<string, unknown>;
};

type Snapshot = {
  docs: SnapshotDoc[];
};

const STORAGE_PREFIX = "terraform-flora.localdb.";
const listeners = new Map<string, Set<() => void>>();

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isTimestampMarker = (value: unknown): value is { __serverTimestamp: true } =>
  typeof value === "object" && value !== null && "__serverTimestamp" in value;

const encodeValue = (value: unknown): JsonValue => {
  if (isTimestampMarker(value)) {
    return { __localTimestamp: new Date().toISOString() };
  }

  if (Array.isArray(value)) {
    return value.map((item) => encodeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, encodeValue(nested)]));
  }

  return (value ?? null) as Primitive;
};

const decodeValue = (value: JsonValue): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => decodeValue(item));
  }

  if (value && typeof value === "object") {
    const timestampValue = (value as Record<string, JsonValue>).__localTimestamp;
    if (typeof timestampValue === "string") {
      return {
        toDate: () => new Date(timestampValue),
        toISOString: () => timestampValue,
      };
    }

    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, decodeValue(nested)]));
  }

  return value;
};

const getCollectionKey = (name: string) => `${STORAGE_PREFIX}${name}`;

const readCollection = (name: string): StoredDoc[] => {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(getCollectionKey(name));
  if (!raw) return [];

  try {
    return JSON.parse(raw) as StoredDoc[];
  } catch {
    return [];
  }
};

const writeCollection = (name: string, docs: StoredDoc[]) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(getCollectionKey(name), JSON.stringify(docs));
  listeners.get(name)?.forEach((listener) => listener());
};

const materializeDocs = (docs: StoredDoc[]): SnapshotDoc[] =>
  docs.map((stored) => ({
    id: stored.id,
    data: () => decodeValue(stored) as Record<string, unknown>,
  }));

const applyQuery = (queryRef: QueryRef): StoredDoc[] => {
  let docs = [...readCollection(queryRef.collection)];

  for (const constraint of queryRef.constraints) {
    if (constraint.type === "where") {
      docs = docs.filter((doc) => doc[constraint.field] === constraint.value);
    }

    if (constraint.type === "orderBy") {
      docs.sort((a, b) => {
        const left = a[constraint.field];
        const right = b[constraint.field];
        if (left === right) return 0;
        if (constraint.direction === "desc") {
          return String(left ?? "").localeCompare(String(right ?? "")) * -1;
        }
        return String(left ?? "").localeCompare(String(right ?? ""));
      });
    }

    if (constraint.type === "limit") {
      docs = docs.slice(0, constraint.count);
    }
  }

  return docs;
};

const getSnapshot = (ref: CollectionRef | QueryRef): Snapshot => {
  const docs = ref.kind === "collection" ? readCollection(ref.name) : applyQuery(ref);
  return { docs: materializeDocs(docs) };
};

export const db = { provider: "local" as const };

export const auth = {
  currentUser: null as
    | {
        uid?: string;
        email?: string | null;
        emailVerified?: boolean;
        isAnonymous?: boolean;
      }
    | null,
};

export const collection = (_db: typeof db, name: string): CollectionRef => ({
  kind: "collection",
  name,
});

export const doc = (...args: [typeof db, string, string] | [CollectionRef] | [typeof db, string]) => {
  if (args.length === 1) {
    return {
      kind: "doc" as const,
      collection: args[0].name,
      id: createId(),
    };
  }

  if (args.length === 2) {
    return {
      kind: "doc" as const,
      collection: args[1],
      id: createId(),
    };
  }

  return {
    kind: "doc" as const,
    collection: args[1],
    id: args[2],
  };
};

export const where = (field: string, op: "==", value: JsonValue): Constraint => ({ type: "where", field, op, value });
export const orderBy = (field: string, direction: "asc" | "desc" = "asc"): Constraint => ({ type: "orderBy", field, direction });
export const limit = (count: number): Constraint => ({ type: "limit", count });
export const query = (ref: CollectionRef, ...constraints: Constraint[]): QueryRef => ({ kind: "query", collection: ref.name, constraints });
export const serverTimestamp = () => ({ __serverTimestamp: true } as const);

export const onSnapshot = (
  ref: CollectionRef | QueryRef,
  onNext: (snapshot: Snapshot) => void,
  onError?: (error: unknown) => void
) => {
  try {
    const collectionName = ref.kind === "collection" ? ref.name : ref.collection;
    const notify = () => onNext(getSnapshot(ref));

    notify();

    const set = listeners.get(collectionName) ?? new Set<() => void>();
    set.add(notify);
    listeners.set(collectionName, set);

    return () => {
      const current = listeners.get(collectionName);
      current?.delete(notify);
      if (current && current.size === 0) {
        listeners.delete(collectionName);
      }
    };
  } catch (error) {
    onError?.(error);
    return () => undefined;
  }
};

export const addDoc = async (ref: CollectionRef, data: Record<string, unknown>) => {
  const docs = readCollection(ref.name);
  const encoded = encodeValue(data) as Record<string, JsonValue>;
  const newDoc = { id: createId(), ...encoded } as StoredDoc;
  docs.push(newDoc);
  writeCollection(ref.name, docs);
  return { id: newDoc.id };
};

export const setDoc = async (ref: DocRef, data: Record<string, unknown>, options?: { merge?: boolean }) => {
  const docs = readCollection(ref.collection);
  const index = docs.findIndex((item) => item.id === ref.id);
  const encoded = encodeValue(data) as Record<string, JsonValue>;

  if (index >= 0) {
    docs[index] = options?.merge ? { ...docs[index], ...encoded, id: ref.id } : ({ id: ref.id, ...encoded } as StoredDoc);
  } else {
    docs.push({ id: ref.id, ...encoded });
  }

  writeCollection(ref.collection, docs);
};

export const updateDoc = async (ref: DocRef, data: Record<string, unknown>) => {
  const docs = readCollection(ref.collection);
  const index = docs.findIndex((item) => item.id === ref.id);
  if (index < 0) return;
  docs[index] = { ...docs[index], ...(encodeValue(data) as Record<string, JsonValue>), id: ref.id };
  writeCollection(ref.collection, docs);
};

export const deleteDoc = async (ref: DocRef) => {
  const docs = readCollection(ref.collection).filter((item) => item.id !== ref.id);
  writeCollection(ref.collection, docs);
};

export const getDocs = async (ref: QueryRef | CollectionRef) => getSnapshot(ref);

export const writeBatch = (_db: typeof db) => {
  const ops: Array<() => void> = [];

  return {
    set(ref: DocRef, data: Record<string, unknown>) {
      ops.push(() => {
        void setDoc(ref, data);
      });
    },
    update(ref: DocRef, data: Record<string, unknown>) {
      ops.push(() => {
        void updateDoc(ref, data);
      });
    },
    delete(ref: DocRef) {
      ops.push(() => {
        void deleteDoc(ref);
      });
    },
    async commit() {
      ops.forEach((run) => run());
    },
  };
};

export const getDoc = async (ref: DocRef) => {
  const found = readCollection(ref.collection).find((item) => item.id === ref.id);
  return {
    exists: () => Boolean(found),
    id: ref.id,
    data: () => (found ? (decodeValue(found) as Record<string, unknown>) : undefined),
  };
};

export const getDocFromServer = getDoc;
