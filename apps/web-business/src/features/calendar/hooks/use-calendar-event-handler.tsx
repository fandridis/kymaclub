import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import { toast } from "sonner";
import type { EventDropArg } from "@fullcalendar/core";
import { convertTimezoneToUtc, convertUtcToTimezone } from "@/lib/timezone-utils";
import type { EventResizeDoneArg } from "@fullcalendar/interaction/index.js";

interface PendingTimeUpdate {
    instance: Doc<"classInstances">;
    newStartTime: number;
    newEndTime: number;
    revertFn: () => void;
    dayChanged: boolean;
}

export const useCalendarEventHandler = (businessTimezone: string) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState<PendingTimeUpdate | null>(null);
    const updateSingleInstance = useMutation(api.mutations.classInstances.updateSingleInstance);
    const updateMultipleInstances = useMutation(api.mutations.classInstances.updateMultipleInstances);

    const processTimeUpdate = useCallback((
        classInstance: Doc<"classInstances">,
        newStartLocal: Date,
        newEndLocal: Date
    ) => {
        const newStartTime = convertTimezoneToUtc(newStartLocal, businessTimezone).getTime();
        const newEndTime = convertTimezoneToUtc(newEndLocal, businessTimezone).getTime();

        // For day change detection, compare dates in business timezone
        const originalStartInBusinessTz = convertUtcToTimezone(new Date(classInstance.startTime), businessTimezone);
        const newStartInBusinessTz = convertUtcToTimezone(new Date(newStartTime), businessTimezone);
        const dayChanged = originalStartInBusinessTz.toDateString() !== newStartInBusinessTz.toDateString();

        return { newStartTime, newEndTime, dayChanged };
    }, [businessTimezone]);

    const handleEventDrop = useCallback((dropInfo: EventDropArg) => {
        const classInstance = dropInfo.event.extendedProps.classInstance as Doc<"classInstances">;

        if (!classInstance) {
            toast.error("Cannot modify this event.");
            dropInfo.revert();
            return;
        }

        const { newStartTime, newEndTime, dayChanged } = processTimeUpdate(
            classInstance,
            dropInfo.event.start!,
            dropInfo.event.end!
        );

        setPendingUpdate({
            instance: classInstance,
            newStartTime,
            newEndTime,
            revertFn: dropInfo.revert,
            dayChanged,
        });
    }, [processTimeUpdate]);

    const handleEventResize = useCallback((resizeInfo: EventResizeDoneArg) => {
        const classInstance = resizeInfo.event.extendedProps.classInstance as Doc<"classInstances">;

        if (!classInstance) {
            toast.error("Cannot modify this event.");
            resizeInfo.revert();
            return;
        }

        const { newStartTime, newEndTime, dayChanged } = processTimeUpdate(
            classInstance,
            resizeInfo.event.start!,
            resizeInfo.event.end!
        );

        setPendingUpdate({
            instance: classInstance,
            newStartTime,
            newEndTime,
            revertFn: resizeInfo.revert,
            dayChanged,
        });
    }, [processTimeUpdate]);

    const handleConfirmSingleUpdate = useCallback(async () => {
        if (!pendingUpdate) return;

        setIsUpdating(true);
        try {
            await updateSingleInstance({
                instanceId: pendingUpdate.instance._id,
                instance: {
                    startTime: pendingUpdate.newStartTime,
                    endTime: pendingUpdate.newEndTime,
                }
            });

            const duration = Math.round((pendingUpdate.newEndTime - pendingUpdate.newStartTime) / (1000 * 60));
            toast.success(`Updated "${pendingUpdate.instance.name}" time (${duration} minutes)`);

            setPendingUpdate(null);
        } catch (error) {
            console.error('Failed to update event:', error);
            toast.error('Failed to update event. Please try again.');
            pendingUpdate.revertFn();
        } finally {
            setIsUpdating(false);
        }
    }, [pendingUpdate, updateSingleInstance]);

    const handleConfirmMultipleUpdate = useCallback(async () => {
        if (!pendingUpdate) return;

        setIsUpdating(true);
        try {
            const result = await updateMultipleInstances({
                instanceId: pendingUpdate.instance._id,
                instance: {
                    startTime: pendingUpdate.newStartTime,
                    endTime: pendingUpdate.newEndTime,
                }
            });

            toast.success(`Updated ${result.totalUpdated} similar classes successfully!`);

            setPendingUpdate(null);
        } catch (error) {
            console.error('Failed to update multiple events:', error);
            toast.error('Failed to update similar classes. Please try again.');
            pendingUpdate.revertFn();
        } finally {
            setIsUpdating(false);
        }
    }, [pendingUpdate, updateMultipleInstances]);

    const handleCancelUpdate = useCallback(() => {
        if (pendingUpdate) {
            pendingUpdate.revertFn();
            setPendingUpdate(null);
        }
    }, [pendingUpdate]);

    return {
        handleEventDrop,
        handleEventResize,
        isUpdating,
        pendingUpdate,
        handleConfirmSingleUpdate,
        handleConfirmMultipleUpdate,
        handleCancelUpdate,
    };
};
