import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AppUser } from "../types";
import { AuthRole } from "./roleService";

export type AuthMode = "signin" | "signup";

export interface AuthPayload {
  mode: AuthMode;
  email: string;
  password: string;
  fullName?: string;
}

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AuthRole;
  is_active: boolean;
}

const getFallbackDisplayName = (user: User) =>
  (user.user_metadata?.full_name as string | undefined) ||
  (user.user_metadata?.name as string | undefined) ||
  user.email?.split("@")[0] ||
  null;

const mapSupabaseUser = (user: User, profile?: ProfileRow | null): AppUser => ({
  uid: user.id,
  email: profile?.email ?? user.email ?? null,
  displayName: profile?.full_name ?? getFallbackDisplayName(user),
  photoURL: (user.user_metadata?.avatar_url as string | undefined) || null,
  role: profile?.role ?? "user",
  isActive: profile?.is_active ?? true,
});

export const getUserProfile = async (userId: string) => {
  if (!supabase) throw new Error("Supabase chưa được cấu hình.");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data;
};

export const upsertUserProfile = async ({
  id,
  email,
  fullName,
}: {
  id: string;
  email: string | null;
  fullName?: string | null;
}) => {
  if (!supabase) throw new Error("Supabase chưa được cấu hình.");

  const payload = {
    id,
    email,
    full_name: fullName?.trim() || (email ? email.split("@")[0] : null),
    role: "user" as const,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, email, full_name, role, is_active")
    .single<ProfileRow>();

  if (error) throw error;
  return data;
};

export const getCurrentAppUser = async () => {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const profile = await getUserProfile(session.user.id).catch(() => null);
  return mapSupabaseUser(session.user, profile);
};

export const onAppAuthStateChange = (callback: (user: AppUser | null, event: AuthChangeEvent, session: Session | null) => void) => {
  if (!supabase) return () => undefined;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (!session?.user) {
      callback(null, event, session);
      return;
    }

    void getUserProfile(session.user.id)
      .then((profile) => callback(mapSupabaseUser(session.user, profile), event, session))
      .catch(() => callback(mapSupabaseUser(session.user, null), event, session));
  });

  return () => subscription.unsubscribe();
};

export const signInWithSupabasePassword = async ({ email, password }: AuthPayload) => {
  if (!supabase) throw new Error("Supabase chưa được cấu hình.");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signUpWithSupabasePassword = async ({ email, password, fullName }: AuthPayload) => {
  if (!supabase) throw new Error("Supabase chưa được cấu hình.");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName?.trim() || email.split("@")[0],
      },
    },
  });

  if (error) throw error;

  if (data.user && data.session) {
    await upsertUserProfile({
      id: data.user.id,
      email: data.user.email ?? email,
      fullName: fullName?.trim() || data.user.user_metadata?.full_name,
    });
  }

  return data;
};

export const signOutFromSupabase = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
