import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShieldCheck } from 'lucide-react';

export function AuthorizeBusinessDialog({
    trigger,
    isOpen,
    onOpenChange
}: {
    trigger?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Internal state if not controlled
    const [internalOpen, setInternalOpen] = useState(false);
    const isDialogOpen = isOpen !== undefined ? isOpen : internalOpen;
    const setDialogOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

    const createAuthorizedEmail = useMutation(api.internal.mutations.businesses.authorizeEmail);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) return;

        setIsSubmitting(true);
        try {
            await createAuthorizedEmail({
                email,
                notes: notes || undefined,
            });
            setDialogOpen(false);
            setEmail('');
            setNotes('');
        } catch (error: any) {
            console.error('Failed to authorize email:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-cyan-500" />
                        Authorize Business Email
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Whitelist an email address to allow business account creation.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="business@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-slate-200">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Reason for authorization..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500 min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDialogOpen(false)}
                            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Authorize
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
