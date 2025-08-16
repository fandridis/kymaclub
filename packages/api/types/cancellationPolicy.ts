import { Infer, v } from "convex/values";
import { cancellationPoliciesFields } from "../convex/schema";

const cancellationPolicyFieldObject = v.object(cancellationPoliciesFields);

export type CancellationPolicy = Infer<typeof cancellationPolicyFieldObject>;