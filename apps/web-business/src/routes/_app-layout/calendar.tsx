import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { CalendarPage } from '@/features/calendar/components/calendar-page';
import { useClassInstances } from '@/features/calendar/hooks/use-class-instances';
import { useCurrentUser } from '@/components/stores/auth';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { useEffect } from 'react';
import { format } from 'date-fns';

const currentDate = new Date();

const calendarSearchSchema = z.object({
    date: z.string().optional(),
});

export const Route = createFileRoute('/_app-layout/calendar')({
    validateSearch: calendarSearchSchema,
    component: RouteComponent,
});

function RouteComponent() {
    const { date } = Route.useSearch();
    const navigate = Route.useNavigate();
    const user = useCurrentUser();
    const startDate = date ? new Date(date) : currentDate;
    const { classInstances, loading } = useClassInstances({ startDate: startDate.getTime() });

    // Update URL to include date param when it's missing
    useEffect(() => {
        if (!date) {
            const currentDateString = format(currentDate, 'yyyy-MM-dd');
            navigate({
                search: { date: currentDateString },
                replace: true,
            });
        }
    }, [date, navigate]);

    return (
        <>
            <Header fixed title="My Calendar" />
            <Main className="-pr-4">
                <CalendarPage
                    startDate={startDate}
                    classInstances={classInstances}
                    user={user}
                    loading={loading}
                />
            </Main>
        </>
    );
}