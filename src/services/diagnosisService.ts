import { RealtimeChannel } from "@supabase/supabase-js";
import { addDoc, collection, db, limit, onSnapshot, orderBy, query, where } from "../lib/localDb";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { Diagnosis } from "../types";

type DiagnosisRow = {
  id: string;
  user_id: string;
  disease_name: string;
  crop_name: string;
  confidence: number | null;
  severity: string | null;
  treatment: string[] | null;
  recommendation: string | null;
  symptoms: string[] | null;
  pesticide_type: string | null;
  pathogen: string | null;
  risk_level: number | null;
  spread_speed: string | null;
  prevention: string[] | null;
  treatment_checklist: string[] | null;
  raw_label: string | null;
  top_predictions:
    | Array<{
        rawLabel: string;
        diseaseName: string;
        cropName: string;
        confidence: number;
      }>
    | null;
  confidence_breakdown: Diagnosis["confidenceBreakdown"] | null;
  provider: string | null;
  model: string | null;
  image_url: string;
  created_at: string;
};

type CreateDiagnosisInput = Omit<Diagnosis, "id" | "timestamp" | "createdAt"> & {
  userId: string;
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase chưa được cấu hình.");
  }

  return supabase;
};

const toError = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return new Error(String((error as { message?: unknown }).message || fallback));
  }

  return new Error(fallback);
};

const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

const mapDiagnosisRow = (row: DiagnosisRow): Diagnosis => ({
  id: row.id,
  userId: row.user_id,
  diseaseName: row.disease_name,
  cropName: row.crop_name,
  confidence: row.confidence ?? 0,
  severity: row.severity ?? "Trung bình",
  treatment: row.treatment ?? [],
  recommendation: row.recommendation ?? "",
  symptoms: row.symptoms ?? [],
  pesticideType: row.pesticide_type ?? undefined,
  pathogen: row.pathogen ?? undefined,
  riskLevel: row.risk_level ?? undefined,
  spreadSpeed: row.spread_speed ?? undefined,
  prevention: row.prevention ?? undefined,
  treatmentChecklist: row.treatment_checklist ?? undefined,
  rawLabel: row.raw_label ?? undefined,
  topPredictions: row.top_predictions ?? undefined,
  confidenceBreakdown: row.confidence_breakdown ?? undefined,
  provider: row.provider ?? undefined,
  model: row.model ?? undefined,
  imageUrl: row.image_url,
  timestamp: row.created_at,
  createdAt: row.created_at,
});

const toInsertPayload = (input: CreateDiagnosisInput) => ({
  user_id: input.userId,
  disease_name: input.diseaseName,
  crop_name: input.cropName,
  confidence: input.confidence,
  severity: input.severity,
  treatment: input.treatment,
  recommendation: input.recommendation,
  symptoms: input.symptoms,
  pesticide_type: input.pesticideType ?? null,
  pathogen: input.pathogen ?? null,
  risk_level: input.riskLevel ?? null,
  spread_speed: input.spreadSpeed ?? null,
  prevention: input.prevention ?? null,
  treatment_checklist: input.treatmentChecklist ?? null,
  raw_label: input.rawLabel ?? null,
  top_predictions: input.topPredictions ?? null,
  confidence_breakdown: input.confidenceBreakdown ?? null,
  provider: input.provider ?? null,
  model: input.model ?? null,
  image_url: input.imageUrl,
});

const LOCAL_DIAGNOSIS_LIMIT = 20;

const listDiagnosesFromLocal = async ({ userId, take }: { userId?: string; take: number }) => {
  const constraints = userId
    ? [where("userId", "==", userId), orderBy("createdAt", "desc"), limit(take)]
    : [orderBy("createdAt", "desc"), limit(take)];
  const snapshot = await new Promise<Diagnosis[]>((resolve, reject) => {
    const unsubscribe = onSnapshot(
      query(collection(db, "diagnoses"), ...constraints),
      (value) => {
        resolve(value.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Diagnosis)));
        unsubscribe();
      },
      reject
    );
  });

  return snapshot;
};

export const listDiagnoses = async ({ userId, take = LOCAL_DIAGNOSIS_LIMIT }: { userId?: string; take?: number } = {}) => {
  if (!isSupabaseConfigured || !supabase) {
    return listDiagnosesFromLocal({ userId, take });
  }

  const client = requireSupabase();
  let request = client
    .from("diagnoses")
    .select(
      "id, user_id, disease_name, crop_name, confidence, severity, treatment, recommendation, symptoms, pesticide_type, pathogen, risk_level, spread_speed, prevention, treatment_checklist, raw_label, confidence_breakdown, provider, model, image_url, created_at"
      .replace("raw_label, confidence_breakdown", "raw_label, top_predictions, confidence_breakdown")
    )
    .order("created_at", { ascending: false })
    .limit(take);

  if (userId) {
    request = request.eq("user_id", userId);
  }

  const { data, error } = await request.returns<DiagnosisRow[]>();
  if (error) throw toError(error, "Không tải được lịch sử chẩn đoán.");
  return (data ?? []).map(mapDiagnosisRow);
};

export const createDiagnosis = async (input: CreateDiagnosisInput): Promise<Diagnosis> => {
  if (!isSupabaseConfigured || !supabase || !isUuid(input.userId)) {
    const payload = {
      ...input,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "diagnoses"), payload);
    return { id: docRef.id, ...payload } as Diagnosis;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("diagnoses")
    .insert(toInsertPayload(input))
    .select(
      "id, user_id, disease_name, crop_name, confidence, severity, treatment, recommendation, symptoms, pesticide_type, pathogen, risk_level, spread_speed, prevention, treatment_checklist, raw_label, confidence_breakdown, provider, model, image_url, created_at"
      .replace("raw_label, confidence_breakdown", "raw_label, top_predictions, confidence_breakdown")
    )
    .single<DiagnosisRow>();

  if (error) throw toError(error, "Không lưu được kết quả chẩn đoán.");
  return mapDiagnosisRow(data);
};

export const subscribeToDiagnoses = ({
  userId,
  take = LOCAL_DIAGNOSIS_LIMIT,
  onData,
  onError,
}: {
  userId?: string;
  take?: number;
  onData: (items: Diagnosis[]) => void;
  onError?: (error: unknown) => void;
}) => {
  if (!isSupabaseConfigured || !supabase) {
    const constraints = userId
      ? [where("userId", "==", userId), orderBy("createdAt", "desc"), limit(take)]
      : [orderBy("createdAt", "desc"), limit(take)];

    return onSnapshot(
      query(collection(db, "diagnoses"), ...constraints),
      (snapshot) => onData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Diagnosis))),
      onError
    );
  }

  let cancelled = false;
  const refresh = async () => {
    try {
      const items = await listDiagnoses({ userId, take });
      if (!cancelled) {
        onData(items);
      }
    } catch (error) {
      if (!cancelled) {
        onError?.(error);
      }
    }
  };

  void refresh();

  const filter = userId ? `user_id=eq.${userId}` : undefined;
  const channel: RealtimeChannel = requireSupabase()
    .channel(`diagnoses:${userId ?? "all"}:${take}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "diagnoses",
        filter,
      },
      () => {
        void refresh();
      }
    )
    .subscribe((status, error) => {
      if (status === "CHANNEL_ERROR") {
        onError?.(error ?? new Error("Không thể subscribe realtime cho diagnoses."));
      }
    });

  return () => {
    cancelled = true;
    void requireSupabase().removeChannel(channel);
  };
};
