import { supabase } from "../lib/supabase.js";

export type AdminUserProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const mapRow = (row: AdminUserRow): AdminUserProfile => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listAdminUsers = async () => {
  if (!supabase) throw new Error("Supabase chưa được cấu hình.");

  const { data, error } = await supabase
    .from("admin_user_overview")
    .select("id, email, full_name, role, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as AdminUserRow[]).map(mapRow);
};

export const updateAdminUserProfile = async ({
  id,
  role,
  isActive,
}: {
  id: string;
  role?: "user" | "admin";
  isActive?: boolean;
}) => {
  if (!supabase) throw new Error("Supabase chưa được cấu hình.");

  const payload: { role?: "user" | "admin"; is_active?: boolean } = {};
  if (role) payload.role = role;
  if (typeof isActive === "boolean") payload.is_active = isActive;

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select("id, email, full_name, role, is_active, created_at, updated_at")
    .single<AdminUserRow>();

  if (error) throw error;
  return mapRow(data);
};
