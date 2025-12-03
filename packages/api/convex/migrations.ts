import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

// Initialize the migrations component
export const migrations = new Migrations<DataModel>(components.migrations);

// Export the run function for CLI usage
// Usage: npx convex run migrations:run '{"fn": "migrations:renameCancelReasonField"}'
export const run = migrations.runner();

/**
 * Migration: Rename cancelReason to cancelByBusinessReason
 * 
 * This migration copies data from the deprecated `cancelReason` field 
 * to `cancelByBusinessReason` and clears the old field.
 * 
 * Run with:
 *   npx convex run migrations:run '{"fn": "migrations:renameCancelReasonField"}'
 * 
 * Check status with:
 *   npx convex run --component migrations lib:getStatus --watch
 * 
 * After migration completes, remove `cancelReason` from schema.ts
 */
export const renameCancelReasonField = migrations.define({
    table: "bookings",
    migrateOne: async (ctx, doc) => {
        // const oldReason = doc.cancelReason;
        // // Skip if no old field to migrate
        // if (oldReason === undefined) return;

        // // Copy to new field (if not already set) and clear old field
        // await ctx.db.patch(doc._id, {
        //     cancelByBusinessReason: doc.cancelByBusinessReason ?? oldReason,
        //     cancelReason: undefined,
        // });
    },
});

