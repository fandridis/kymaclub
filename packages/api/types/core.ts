import type { Doc } from "../convex/_generated/dataModel";

export interface ValidationResult<T> {
    success: boolean;
    value?: T;
    error?: string;
}

export interface AuthContext {
    user: Doc<"users">;
    business: Doc<"businesses">;
}