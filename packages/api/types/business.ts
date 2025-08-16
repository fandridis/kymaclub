import { Infer, v } from "convex/values";
import { businessesFields } from "../convex/schema";

const businessFieldObject = v.object(businessesFields);

export type Business = Infer<typeof businessFieldObject>;
