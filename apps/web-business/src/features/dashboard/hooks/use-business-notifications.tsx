import { usePaginatedQuery } from "convex-helpers/react/cache";
import { api } from "@repo/api/convex/_generated/api";

export const useBusinessNotifications = (initialNumItems: number = 20) => {
    return usePaginatedQuery(
        api.queries.notifications.getBusinessNotifications,
        { unreadOnly: false },
        { initialNumItems }
    );
};

export const useUnreadBusinessNotifications = (initialNumItems: number = 10) => {
    return usePaginatedQuery(
        api.queries.notifications.getBusinessNotifications,
        { unreadOnly: true },
        { initialNumItems }
    );
};

export type BusinessNotification = NonNullable<
    Awaited<ReturnType<typeof useBusinessNotifications>>['results']
>[number];