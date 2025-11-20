import { createFileRoute, redirect } from '@tanstack/react-router';
import { SpinningCircles } from '@/components/spinning-circles';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAuthActions } from '@convex-dev/auth/react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_app-layout/dashboard')({
    component: Dashboard,
});

function Dashboard() {
    const { user, isLoading } = useCurrentUser();
    const { signOut } = useAuthActions();

    if (isLoading) {
        return <SpinningCircles />
    }

    if (!user) {
        return redirect({
            to: '/sign-in-tester',
            replace: true,
            search: {
                redirect: window.location.href
            }
        })
    }

    const userName = user.name || user.email || "Admin";

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/sign-in-tester';
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Hello {userName}</h1>
                <p className="text-muted-foreground mb-6">Welcome to the admin dashboard</p>
                <Button
                    variant="outline"
                    onClick={handleLogout}
                >
                    Logout
                </Button>
            </div>
        </div>
    );
}
