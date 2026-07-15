import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { GrowthCycle, GrowthPhoto, GrowthTask } from "../types";

type GrowthCycleRow = {
  id: string;
  user_id: string;
  crop_name: string;
  start_date: string;
  duration: number;
  current_stage: GrowthCycle["currentStage"];
  status: GrowthCycle["status"];
  notes: string | null;
  progress: number;
  last_update: string;
};

type GrowthTaskRow = {
  id: string;
  cycle_id: string;
  user_id: string;
  title: string;
  due_date: string;
  completed: boolean;
  type: GrowthTask["type"];
};

type GrowthPhotoRow = {
  id: string;
  cycle_id: string;
  user_id: string;
  url: string;
  date: string;
  note: string | null;
};

type GrowthCropRow = {
  id: string;
  name: string;
};

export type GrowthCatalogCrop = {
  id: string;
  name: string;
};

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase chưa được cấu hình.");
  }

  return supabase;
};

const mapCycle = (row: GrowthCycleRow): GrowthCycle => ({
  id: row.id,
  userId: row.user_id,
  cropName: row.crop_name,
  startDate: row.start_date,
  duration: row.duration,
  currentStage: row.current_stage,
  status: row.status,
  notes: row.notes ?? "",
  progress: row.progress,
  lastUpdate: row.last_update,
});

const mapTask = (row: GrowthTaskRow): GrowthTask => ({
  id: row.id,
  cycleId: row.cycle_id,
  userId: row.user_id,
  title: row.title,
  dueDate: row.due_date,
  completed: row.completed,
  type: row.type,
});

const mapPhoto = (row: GrowthPhotoRow): GrowthPhoto => ({
  id: row.id,
  cycleId: row.cycle_id,
  userId: row.user_id,
  url: row.url,
  date: row.date,
  note: row.note ?? "",
});

export const listGrowthCycles = async (userId: string) => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("growth_cycles")
    .select("id, user_id, crop_name, start_date, duration, current_stage, status, notes, progress, last_update")
    .eq("user_id", userId)
    .order("last_update", { ascending: false });

  if (error) throw error;
  return (data as GrowthCycleRow[]).map(mapCycle);
};

export const listGrowthCatalogCrops = async () => {
  const client = ensureSupabase();
  const { data, error } = await client.from("crops").select("id, name").order("name", { ascending: true });

  if (error) throw error;
  return (data as GrowthCropRow[]).map((row) => ({
    id: row.id,
    name: row.name,
  })) as GrowthCatalogCrop[];
};

export const listGrowthTasks = async (cycleId: string) => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("growth_tasks")
    .select("id, cycle_id, user_id, title, due_date, completed, type")
    .eq("cycle_id", cycleId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return (data as GrowthTaskRow[]).map(mapTask);
};

export const listGrowthPhotos = async (cycleId: string) => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("growth_photos")
    .select("id, cycle_id, user_id, url, date, note")
    .eq("cycle_id", cycleId)
    .order("date", { ascending: false });

  if (error) throw error;
  return (data as GrowthPhotoRow[]).map(mapPhoto);
};

export const createGrowthCycle = async (payload: {
  userId: string;
  cropName: string;
  startDate: string;
  duration: number;
  currentStage: GrowthCycle["currentStage"];
  status: GrowthCycle["status"];
  notes?: string;
}) => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("growth_cycles")
    .insert({
      user_id: payload.userId,
      crop_name: payload.cropName,
      start_date: payload.startDate,
      duration: payload.duration,
      current_stage: payload.currentStage,
      status: payload.status,
      notes: payload.notes?.trim() || null,
      progress: 0,
      last_update: new Date().toISOString(),
    })
    .select("id, user_id, crop_name, start_date, duration, current_stage, status, notes, progress, last_update")
    .single();

  if (error) throw error;
  return mapCycle(data as GrowthCycleRow);
};

export const createGrowthTasks = async (
  tasks: Array<{
    cycleId: string;
    userId: string;
    title: string;
    dueDate: string;
    completed?: boolean;
    type: GrowthTask["type"];
  }>
) => {
  if (tasks.length === 0) return [];
  const client = ensureSupabase();
  const { data, error } = await client
    .from("growth_tasks")
    .insert(
      tasks.map((task) => ({
        cycle_id: task.cycleId,
        user_id: task.userId,
        title: task.title,
        due_date: task.dueDate,
        completed: task.completed ?? false,
        type: task.type,
      }))
    )
    .select("id, cycle_id, user_id, title, due_date, completed, type");

  if (error) throw error;
  return (data as GrowthTaskRow[]).map(mapTask);
};

export const createGrowthTask = async (task: {
  cycleId: string;
  userId: string;
  title: string;
  dueDate: string;
  type: GrowthTask["type"];
}) => {
  const created = await createGrowthTasks([{ ...task, completed: false }]);
  return created[0];
};

export const updateGrowthCycle = async (
  cycleId: string,
  updates: Partial<{
    cropName: string;
    startDate: string;
    duration: number;
    currentStage: GrowthCycle["currentStage"];
    status: GrowthCycle["status"];
    notes: string;
    progress: number;
  }>
) => {
  const client = ensureSupabase();
  const payload: Record<string, unknown> = { last_update: new Date().toISOString() };

  if (updates.cropName !== undefined) payload.crop_name = updates.cropName;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.duration !== undefined) payload.duration = updates.duration;
  if (updates.currentStage !== undefined) payload.current_stage = updates.currentStage;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.notes !== undefined) payload.notes = updates.notes.trim() || null;
  if (updates.progress !== undefined) payload.progress = updates.progress;

  const { data, error } = await client
    .from("growth_cycles")
    .update(payload)
    .eq("id", cycleId)
    .select("id, user_id, crop_name, start_date, duration, current_stage, status, notes, progress, last_update")
    .single();

  if (error) throw error;
  return mapCycle(data as GrowthCycleRow);
};

export const deleteGrowthCycle = async (cycleId: string) => {
  const client = ensureSupabase();
  const { error } = await client.from("growth_cycles").delete().eq("id", cycleId);
  if (error) throw error;
};

export const updateGrowthTask = async (
  taskId: string,
  updates: Partial<{
    title: string;
    dueDate: string;
    completed: boolean;
    type: GrowthTask["type"];
  }>
) => {
  const client = ensureSupabase();
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
  if (updates.completed !== undefined) payload.completed = updates.completed;
  if (updates.type !== undefined) payload.type = updates.type;

  const { data, error } = await client
    .from("growth_tasks")
    .update(payload)
    .eq("id", taskId)
    .select("id, cycle_id, user_id, title, due_date, completed, type")
    .single();

  if (error) throw error;
  return mapTask(data as GrowthTaskRow);
};

export const deleteGrowthTask = async (taskId: string) => {
  const client = ensureSupabase();
  const { error } = await client.from("growth_tasks").delete().eq("id", taskId);
  if (error) throw error;
};

export const createGrowthPhoto = async (photo: {
  cycleId: string;
  userId: string;
  url: string;
  date: string;
  note?: string;
}) => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("growth_photos")
    .insert({
      cycle_id: photo.cycleId,
      user_id: photo.userId,
      url: photo.url,
      date: photo.date,
      note: photo.note?.trim() || null,
    })
    .select("id, cycle_id, user_id, url, date, note")
    .single();

  if (error) throw error;
  return mapPhoto(data as GrowthPhotoRow);
};

export const deleteGrowthPhoto = async (photoId: string) => {
  const client = ensureSupabase();
  const { error } = await client.from("growth_photos").delete().eq("id", photoId);
  if (error) throw error;
};
