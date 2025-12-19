
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useQuery, useAction } from 'convex/react';
import { useTypedTranslation } from '@/lib/typed';
import { toast } from 'sonner';
import { api } from '@repo/api/convex/_generated/api';

export function StripeConnectCard() {
    const { t } = useTypedTranslation();
    const business = useQuery(api.queries.businesses.getMyBusiness);
    const createConnectedAccount = useAction(api.actions.stripeConnect.createConnectedAccount);
    const getLoginLink = useAction(api.actions.stripeConnect.getLoginLink);
    const checkStatus = useAction(api.actions.stripeConnect.checkAccountStatus);

    const [isLoading, setIsLoading] = useState(false);

    // Auto-check status on mount if pending (e.g. returning from Stripe onboarding)
    useEffect(() => {
        if (business?.stripeConnectedAccountStatus === 'pending') {
            checkStatus({}).catch(console.error);
        }
    }, [business?.stripeConnectedAccountStatus, checkStatus]);

    if (business === undefined) {
        return (
            <Card className="bg-card border-border h-full flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    if (!business) return null;

    const status = business.stripeConnectedAccountStatus || 'not_started';
    const isEnabled = status === 'enabled';
    const isPending = status === 'pending';
    const isRejected = status === 'rejected' || status === 'disabled';

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            const returnUrl = `${window.location.origin}/earnings`;
            const refreshUrl = `${window.location.origin}/earnings`;

            const result = await createConnectedAccount({
                returnUrl,
                refreshUrl
            });

            if (result.accountLink) {
                window.location.href = result.accountLink;
            }
        } catch (error) {
            console.error('Failed to create connected account:', error);
            toast.error(t('common.error'));
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await getLoginLink({});
            if (result.url) {
                window.open(result.url, '_blank');
            }
        } catch (error) {
            console.error('Failed to get login link:', error);
            toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckStatus = async () => {
        setIsLoading(true);
        try {
            await checkStatus({});
            toast.success("Status updated");
            // The action keeps database in sync, query will update automatically
        } catch (error) {
            console.error('Failed to check status:', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        Stripe Connect
                        {isEnabled && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>}
                        {isPending && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>}
                        {isRejected && <Badge variant="destructive">Action Required</Badge>}
                    </CardTitle>
                    {isEnabled && (
                        <Button variant="ghost" size="sm" onClick={handleLogin} disabled={isLoading} className="gap-2 text-primary">
                            Dashboard <ExternalLink className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <CardDescription>
                    {isEnabled
                        ? "Your account is fully set up to receive payments."
                        : "Set up payments to start receiving money from your classes."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {!isEnabled && (
                        <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
                            {isRejected ? (
                                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium">Payment Status</h4>
                                <p className="text-sm text-muted-foreground">
                                    {isPending
                                        ? "Your application is being processed or requires more details."
                                        : isRejected
                                            ? "Your account info needs attention. Please update your details."
                                            : "Connect your bank account to receive payouts directly."}
                                </p>
                            </div>
                        </div>
                    )}

                    {!isEnabled ? (
                        <div className="flex gap-2">
                            <Button onClick={handleConnect} disabled={isLoading} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isPending ? "Continue Setup" : isRejected ? "Update Information" : "Set up Payments"}
                            </Button>
                            {isPending && (
                                <Button variant="outline" onClick={handleCheckStatus} disabled={isLoading} size="icon">
                                    <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-green-50 rounded border border-green-100 dark:bg-green-950/20 dark:border-green-900/50">
                                <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Status</div>
                                <div className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Verified
                                </div>
                            </div>
                            <div className="p-3 bg-muted rounded border border-border">
                                <div className="text-xs text-muted-foreground font-medium mb-1">Payout Schedule</div>
                                <div className="text-sm font-semibold">Daily/Weekly</div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
