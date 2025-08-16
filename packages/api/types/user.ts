import { Infer, v } from "convex/values";
import { usersFields } from "../convex/schema";

const userFieldObject = v.object(usersFields);

export type User = Infer<typeof userFieldObject>;
export type UserBusinessRole = User['businessRole'];
export type UserRole = User['role'];