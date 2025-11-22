import { v } from "convex/values";
import { query } from "../../_generated/server";

export const searchGlobal = query({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        const { query } = args;

        // 1. Fast exit for invalid queries
        if (!query || query.length < 2) {
            return { businesses: [], consumers: [] };
        }

        // 2. Run all 6 queries in parallel
        const [
            bName, bEmail, bPhone,
            cName, cEmail, cPhone
        ] = await Promise.all([
            ctx.db.query("businesses").withSearchIndex("search_name", q => q.search("name", query)).take(7),
            ctx.db.query("businesses").withSearchIndex("search_email", q => q.search("email", query)).take(7),
            ctx.db.query("businesses").withSearchIndex("search_phone", q => q.search("phone", query)).take(7),
            ctx.db.query("users").withSearchIndex("search_name", q => q.search("name", query)).take(7),
            ctx.db.query("users").withSearchIndex("search_email", q => q.search("email", query)).take(7),
            ctx.db.query("users").withSearchIndex("search_phone", q => q.search("phone", query)).take(7),
        ]);

        // 3. Merge, Dedupe, and Retain "Match Reason"
        return {
            businesses: mergeAndDedupeById([
                tagResults(bName, 'Name'),
                tagResults(bEmail, 'Email'),
                tagResults(bPhone, 'Phone')
            ], 7),
            consumers: mergeAndDedupeById([
                tagResults(cName, 'Name'),
                tagResults(cEmail, 'Email'),
                tagResults(cPhone, 'Phone')
            ], 7),
        };
    },
});

function tagResults<T>(list: T[], type: string) {
    return list.map(item => ({
        ...item,
        matchType: type
    }));
}

function mergeAndDedupeById<T extends { _id: string }>(
    lists: T[][],
    limit: number
): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const list of lists) {
        for (const item of list) {
            if (seen.has(item._id)) continue;

            seen.add(item._id);
            result.push(item);

            if (result.length >= limit) return result;
        }
    }

    return result;
}
