import { Infer, v } from "convex/values";
import { businessInvitationsFields } from "../convex/schema";

const businessInvitationFieldObject = v.object(businessInvitationsFields);

export type BusinessInvitation = Infer<typeof businessInvitationFieldObject>;
export type BusinessInvitationRole = BusinessInvitation['role'];
export type BusinessInvitationStatus = BusinessInvitation['status'];