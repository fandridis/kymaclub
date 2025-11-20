import { query } from "../../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { requireInternalUserOrThrow } from "../../utils";

type SortBy = "latest" | "most_expensive" | "capacity";

/**
 * Get all class instances across all businesses (admin/internal only)
 * Returns paginated results sorted by the specified option
 * 
 * Follows Convex pagination pattern: takes paginationOpts and returns result from .paginate()
 */
export const getAllClassInstances = query({
    args: {
        paginationOpts: paginationOptsValidator,
        sortBy: v.optional(v.union(v.literal("latest"), v.literal("most_expensive"), v.literal("capacity"))),
    },
    handler: async (ctx, args) => {
        const user = await requireInternalUserOrThrow(ctx);
        const sortBy: SortBy = args.sortBy || "latest";

        // Use appropriate index based on sortBy option
        if (sortBy === "latest") {
            return await ctx.db
                .query("classInstances")
                .withIndex("by_deleted_start_time", (q) =>
                    q.eq("deleted", undefined)
                )
                .filter((q) => q.eq(q.field("status"), "scheduled"))
                .order("desc") // Most recent startTime first
                .paginate(args.paginationOpts);
        }

        if (sortBy === "most_expensive") {
            return await ctx.db
                .query("classInstances")
                .withIndex("by_deleted_price", (q) =>
                    q.eq("deleted", undefined)
                )
                .filter((q) => q.eq(q.field("status"), "scheduled"))
                .order("desc") // Most expensive first
                .paginate(args.paginationOpts);
        }

        if (sortBy === "capacity") {
            return await ctx.db
                .query("classInstances")
                .withIndex("by_deleted_capacity", (q) =>
                    q.eq("deleted", undefined)
                )
                .filter((q) => q.eq(q.field("status"), "scheduled"))
                .order("desc") // Highest capacity first
                .paginate(args.paginationOpts);
        }

        // Fallback (should not reach here)
        return await ctx.db
            .query("classInstances")
            .withIndex("by_deleted_start_time", (q) =>
                q.eq("deleted", undefined)
            )
            .filter((q) => q.eq(q.field("status"), "scheduled"))
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

