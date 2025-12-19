import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTypedTranslation } from "@/lib/typed";
import { Link } from "@tanstack/react-router";

interface StripeRequiredDialogProps {
    open: boolean;
    onClose: () => void;
}

export function StripeRequiredDialog({ open, onClose }: StripeRequiredDialogProps) {
    const { t } = useTypedTranslation();

    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('routes.calendar.stripeRequired.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('routes.calendar.stripeRequired.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Link to="/earnings">
                            {t('routes.calendar.stripeRequired.goToEarnings')}
                        </Link>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
