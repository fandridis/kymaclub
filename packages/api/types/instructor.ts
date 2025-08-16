import { Infer, v } from "convex/values";
import { instructorsFields } from "../convex/schema";

const instructorFieldObject = v.object(instructorsFields);

export type Instructor = Infer<typeof instructorFieldObject>;