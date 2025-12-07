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

/**
 * Migration: Update class template primaryCategory to class categories
 * 
 * This migration updates all class templates that have venue-style categories
 * (like 'wellness_center', 'yoga_studio') to use the new class category format ('yoga').
 * 
 * Run with:
 *   npx convex run migrations:run '{"fn": "migrations:migrateClassTemplatePrimaryCategory"}'
 * 
 * Check status with:
 *   npx convex run --component migrations lib:getStatus --watch
 */
export const migrateClassTemplatePrimaryCategory = migrations.define({
    table: "classTemplates",
    migrateOne: async (ctx, doc) => {
        // // Update to 'yoga' as the default class category
        // // This replaces old venue-style categories like 'wellness_center', 'yoga_studio', etc.
        // await ctx.db.patch(doc._id, {
        //     primaryCategory: "yoga",
        // });
    },
});

/**
 * Migration: Update class instance primaryCategory to class categories
 * 
 * This migration updates all class instances that have venue-style categories
 * to use the new class category format ('yoga').
 * Also updates the templateSnapshot.primaryCategory embedded field.
 * 
 * Run with:
 *   npx convex run migrations:run '{"fn": "migrations:migrateClassInstancePrimaryCategory"}'
 * 
 * Check status with:
 *   npx convex run --component migrations lib:getStatus --watch
 */
export const migrateClassInstancePrimaryCategory = migrations.define({
    table: "classInstances",
    migrateOne: async (ctx, doc) => {
        // Update primaryCategory and templateSnapshot.primaryCategory to 'yoga'
        await ctx.db.patch(doc._id, {
            primaryCategory: "yoga",
            templateSnapshot: {
                ...doc.templateSnapshot,
                primaryCategory: "yoga",
            },
        });
    },
});

/**
 * Migration: Update templateSnapshot to remove description and add duration/shortDescription
 * 
 * This migration updates all class instances to:
 * - Remove the deprecated `description` field from templateSnapshot
 * - Add `duration` from the corresponding template
 * - Add `shortDescription` from the corresponding template
 * 
 * Run with:
 *   npx convex run migrations:run '{"fn": "migrations:migrateTemplateSnapshotFields"}'
 * 
 * To run with a batch limit (e.g., first 800 documents):
 *   npx convex run migrations:run '{"fn": "migrations:migrateTemplateSnapshotFields", "batchSize": 800}'
 * 
 * Check status with:
 *   npx convex run --component migrations lib:getStatus --watch
 */
export const migrateTemplateSnapshotFields = migrations.define({
    table: "classInstances",
    migrateOne: async (ctx, doc) => {
        // Fetch the corresponding template to get duration and shortDescription
        const template = await ctx.db.get(doc.templateId);

        // Build the new templateSnapshot without description, with duration and shortDescription
        const { description, ...restOfSnapshot } = doc.templateSnapshot as typeof doc.templateSnapshot & { description?: string };

        const updatedTemplateSnapshot = {
            ...restOfSnapshot,
            // Add duration and shortDescription from template (if available)
            duration: template?.duration,
            shortDescription: template?.shortDescription ?? restOfSnapshot.shortDescription,
        };

        await ctx.db.patch(doc._id, {
            templateSnapshot: updatedTemplateSnapshot,
        });
    },
});

