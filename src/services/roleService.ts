import { AppUser } from "../types";

export type AuthRole = "user" | "admin";

export const isAdminUser = (user: AppUser | null) => user?.role === "admin" && user.isActive !== false;

export const getEffectiveUserRole = (user: AppUser | null): AuthRole => (isAdminUser(user) ? "admin" : "user");
