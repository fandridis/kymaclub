import { Infer, v } from "convex/values";
import { classInstancesFields } from "../convex/schema";

const classInstanceFieldObject = v.object(classInstancesFields);

export type ClassInstance = Infer<typeof classInstanceFieldObject>;
export type ClassInstanceStatus = ClassInstance['status'];
