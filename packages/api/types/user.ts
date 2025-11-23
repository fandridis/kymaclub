import { Doc } from "../convex/_generated/dataModel";

export type User = Doc<"users">;
export type UserBusinessRole = User['businessRole'];
export type UserRole = User['role'];