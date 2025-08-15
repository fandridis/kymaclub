import { useEffect } from "react";

/**
 * A small hack to update the calendar size when the sidebar is expanded/collapsed
 * This is because the calendar only listens to the window size, not the sidebar size.
 */

interface UseCalendarResizeProps {
    calendarRef: React.RefObject<any>;
    dependencies?: any[];
}

export function useCalendarResize({ calendarRef, dependencies = [] }: UseCalendarResizeProps) {
    useEffect(() => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();

            setTimeout(() => {
                calendarApi.updateSize();
            }, 250);
        }
    }, dependencies);
}

