import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import elLocale from '@fullcalendar/core/locales/el';
import enGbLocale from '@fullcalendar/core/locales/en-gb';
import i18n from '@/lib/i18n';
import type { UserWithBusiness } from '@/components/stores/auth';
import type { EventContentArg } from '@fullcalendar/core/index.js';
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DeleteEventDialog } from './delete-event-dialog'
import EditClassInstanceDialog from './edit-class-instance-dialog'
import { toast } from 'sonner'
import { CalendarEventCard } from './calendar-event-card'
import { CreateInstanceFromTemplateDialog } from './create-instance-from-template-dialog';
import ConfirmTimeUpdateDialog from './confirm-time-update-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCalendarEventHandler } from '../hooks/use-calendar-event-handler';
import { dbTimestampToBusinessDate } from '@/lib/timezone-utils';
import { format } from 'date-fns';
import type { ClassInstance } from '../hooks/use-class-instances';
import { useSidebar } from '@/components/ui/sidebar';
import { useCalendarResize } from '../hooks/use-calendar-resize';
import { useDoubleClick } from '../hooks/use-double-click';
import { TEMPLATE_COLORS_MAP } from '@/utils/colors';
import type { TemplateColorType } from '@repo/utils/colors';
import { ClassBookingsDialog } from '../../bookings/components/class-bookings-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTypedTranslation } from '@/lib/typed';

interface CalendarPageProps {
    startDate: Date;
    classInstances: ClassInstance[];
    user: UserWithBusiness;
    loading: boolean;
}

export function CalendarPage({ startDate, classInstances, user, loading }: CalendarPageProps) {
    const { t } = useTypedTranslation();
    const navigate = useNavigate({ from: '/calendar' });
    const isMobile = useIsMobile();
    const { state: sidebarState } = useSidebar();
    const [createDialog, setCreateDialog] = useState<{ open: boolean; selectedDateTime: string; } | null>(null);
    const [editDialog, setEditDialog] = useState<{ open: boolean; instance: ClassInstance | null } | null>(null);
    const [viewBookingsDialog, setViewBookingsDialog] = useState<{ open: boolean; classInstance: ClassInstance | null } | null>(null);
    const [deleteDialogInstance, setDeleteDialogInstance] = useState<ClassInstance | null>(null);
    const eventHandlers = useCalendarEventHandler(user.business.timezone);
    const calendarRef = useRef<FullCalendar>(null);
    const updateClassInstance = useMutation(api.mutations.classInstances.updateSingleInstance);

    useCalendarResize({ calendarRef, dependencies: [sidebarState] });

    const handleSelectTimeSlot = useDoubleClick<string>((startStr) => {
        setCreateDialog({ open: true, selectedDateTime: startStr });
    });

    const handleDatesSet = useCallback((start: Date) => {
        // Format dates in local timezone to avoid UTC conversion issues
        const newDate = format(start, 'yyyy-MM-dd');
        const startDateString = format(startDate, 'yyyy-MM-dd');

        if (startDateString !== newDate) {
            navigate({
                search: { date: newDate },
                replace: true,
            });
        }
    }, [navigate, startDate]);

    const handleEdit = (eventInfo: EventContentArg) => {
        const classInstance = eventInfo.event.extendedProps.classInstance as ClassInstance
        setEditDialog({
            open: true,
            instance: classInstance
        });
    }

    const handleDeleteEvent = (eventInfo: EventContentArg) => {
        const classInstance = eventInfo.event.extendedProps.classInstance as ClassInstance
        setDeleteDialogInstance(classInstance);
    };

    const handleViewBookings = (eventInfo: EventContentArg) => {
        const classInstance = eventInfo.event.extendedProps.classInstance as ClassInstance
        console.log('classInstance', classInstance);
        setViewBookingsDialog({
            open: true,
            classInstance: classInstance
        });
    };

    const handleToggleBookings = async (eventInfo: EventContentArg) => {
        const classInstance = eventInfo.event.extendedProps.classInstance as ClassInstance
        try {
            await updateClassInstance({
                instanceId: classInstance._id,
                instance: {
                    disableBookings: !classInstance.disableBookings
                }
            });
            toast.success(classInstance.disableBookings ? t('routes.calendar.bookingsOpened') : t('routes.calendar.bookingsClosed'));
        } catch (error) {
            console.error('Failed to toggle bookings:', error);
            toast.error(t('routes.calendar.failedToUpdateBookingStatus'));
        }
    };

    const preparedCalendarEvents = useMemo(() => {
        return transformClassInstancesToCalendarEvents(classInstances, user.business.timezone);
    }, [classInstances, user.business.timezone]);

    return (
        <div className="flex flex-col h-full">
            <div className="mb-2 flex justify-end flex-shrink-0">
                <Button onClick={() => setCreateDialog({ open: true, selectedDateTime: '' })}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('routes.calendar.newClass')}
                </Button>
            </div>
            <div className='w-full relative flex-1 min-h-0'>
                {loading && (
                    <div className='absolute inset-0 backdrop-blur-xs z-10 flex items-center justify-center' />
                )}
                <FullCalendar
                    ref={calendarRef}
                    initialView={isMobile ? 'timeGridWeek' : 'timeGrid'}
                    dateAlignment={isMobile ? 'day' : 'week'}
                    duration={{ days: isMobile ? 2 : 7 }}
                    plugins={[timeGridPlugin, interactionPlugin]}
                    locales={[elLocale, enGbLocale]}
                    locale={getLocale(i18n.language)}
                    height="100%"
                    expandRows={true}
                    allDaySlot={false}
                    initialDate={startDate}
                    events={preparedCalendarEvents}
                    titleFormat={{ month: 'long', year: 'numeric' }}
                    editable={true}
                    selectable={true}
                    select={(info) => handleSelectTimeSlot(info.startStr)}
                    selectAllow={(selectInfo) => {
                        // Allow only if selection is exactly one slot (30min)
                        const { start, end } = selectInfo;
                        const diff = end.getTime() - start.getTime();
                        return diff === 30 * 60 * 1000;
                    }}
                    eventDrop={eventHandlers.handleEventDrop}
                    eventResize={eventHandlers.handleEventResize}
                    eventAllow={(dropInfo) => dropInfo.start.toDateString() === dropInfo.end.toDateString()}
                    slotMinTime="06:00:00"
                    slotMaxTime="24:00:00"
                    businessHours={{
                        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                        startTime: '06:00',
                        endTime: '24:00',
                    }}
                    snapDuration="00:30:00"
                    droppable={true}
                    datesSet={(arg) => handleDatesSet(arg.start)}
                    eventContent={(eventInfo) =>
                        <CalendarEventCard
                            eventInfo={eventInfo}
                            onEdit={handleEdit}
                            onDelete={handleDeleteEvent}
                            onViewBookings={handleViewBookings}
                            onToggleBookings={handleToggleBookings}
                        />}
                />
            </div>

            {/* Hover Overlay */}
            {/* {hoveredCell && (
                <CalendarCellHoverOverlay
                    x={hoveredCell.x}
                    y={hoveredCell.y}
                    width={hoveredCell.width}
                    height={hoveredCell.height}
                />
            )} */}

            {deleteDialogInstance && (
                <DeleteEventDialog
                    open={true}
                    event={deleteDialogInstance}
                    onClose={() => setDeleteDialogInstance(null)}
                    businessTimezone={user.business.timezone}
                    onDeleteSuccess={({ mode }) => {
                        setDeleteDialogInstance(null);
                        if (mode === 'single') {
                            toast.success(`Deleted "${deleteDialogInstance.name}"`);
                        } else if (mode === 'similar') {
                            toast.success(`Deleted "${deleteDialogInstance.name}" and all future occurrences`);
                        }
                    }} />
            )}

            {editDialog && (
                <EditClassInstanceDialog
                    open={editDialog.open}
                    onClose={() => setEditDialog(null)}
                    instance={editDialog.instance}
                    businessTimezone={user.business.timezone}
                />
            )}

            {createDialog && (
                <CreateInstanceFromTemplateDialog
                    open={createDialog.open}
                    selectedDateTime={createDialog.selectedDateTime}
                    onClose={() => setCreateDialog(null)}
                />
            )}

            {eventHandlers.pendingUpdate && (
                <ConfirmTimeUpdateDialog
                    open={true}
                    onOpenChange={() => { }}
                    onConfirmSingle={eventHandlers.handleConfirmSingleUpdate}
                    onConfirmMultiple={eventHandlers.handleConfirmMultipleUpdate}
                    onCancel={eventHandlers.handleCancelUpdate}
                    isSubmitting={eventHandlers.isUpdating}
                    originalInstance={eventHandlers.pendingUpdate.instance}
                    newStartTime={eventHandlers.pendingUpdate.newStartTime}
                    newEndTime={eventHandlers.pendingUpdate.newEndTime}
                    dayChanged={eventHandlers.pendingUpdate.dayChanged}
                    businessTimezone={user.business.timezone}
                />
            )}

            {viewBookingsDialog && (
                <ClassBookingsDialog
                    open={viewBookingsDialog.open}
                    onOpenChange={(open) => setViewBookingsDialog(prev => prev ? { ...prev, open } : null)}
                    classInstance={viewBookingsDialog.classInstance!}
                >
                    <div />
                </ClassBookingsDialog>
            )}
        </div>
    );
}

/**
 * Transform ClassInstance objects to FullCalendar events
 * 
 * TIMEZONE STRATEGY:
 * 1. Database stores UTC timestamps
 * 2. Convert UTC → business timezone for FullCalendar display  
 * 3. FullCalendar (without timeZone config) treats these as local times
 * 4. This ensures events always display in company timezone regardless of user's location
 */
export const transformClassInstancesToCalendarEvents = (classInstances: ClassInstance[], businessTimezone: string) => {
    return classInstances.map(instance => {
        // Convert UTC timestamps to business timezone times for FullCalendar display
        const startInBusinessTz = dbTimestampToBusinessDate(instance.startTime, businessTimezone);
        const endInBusinessTz = dbTimestampToBusinessDate(instance.endTime, businessTimezone);

        // FullCalendar will interpret these as local times and display them correctly
        const formattedStart = startInBusinessTz.toISOString();
        const formattedEnd = endInBusinessTz.toISOString();

        return {
            id: instance._id,
            allDay: false,
            title: instance.name,
            start: formattedStart,
            end: formattedEnd,
            backgroundColor: TEMPLATE_COLORS_MAP[instance.color as TemplateColorType].backgroundHex,
            opacity: 1,
            classNames: instance.disableBookings ? ['fc-event-hidden'] : [],
            extendedProps: {
                classInstance: instance,
                instructor: instance.instructor,
                capacity: instance.capacity,
                price: instance.price,
                description: instance.description,
                bookedCount: instance.bookedCount || 0,
            },
        };
    });
};

/**
 * Get locale based on the user's language
 */
const getLocale = (language: string) => {
    switch (language) {
        case 'el': return elLocale;
        case 'en': return enGbLocale;
        default: return elLocale;
    }
}