/**
 * @fileoverview Authentication types
 */

export type UserRole = "admin" | "student";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}
