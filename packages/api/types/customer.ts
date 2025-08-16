import { Infer, v } from "convex/values";
import { customersFields } from "../convex/schema";

const customerFieldObject = v.object(customersFields);

export type Customer = Infer<typeof customerFieldObject>;