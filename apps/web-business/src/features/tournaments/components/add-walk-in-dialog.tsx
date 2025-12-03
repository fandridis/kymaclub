"use client"

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import type { Id } from "@repo/api/convex/_generated/dataModel";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddWalkInDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    widgetId: string;
}

export function AddWalkInDialog({ open, onOpenChange, widgetId }: AddWalkInDialogProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addWalkIn = useMutation(api.mutations.widgets.addWalkIn);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            await addWalkIn({
                widgetId: widgetId as Id<"classInstanceWidgets">,
                walkIn: {
                    name: name.trim(),
                    phone: phone.trim() || undefined,
                    email: email.trim() || undefined,
                },
            });
            toast.success("Walk-in participant added");
            setName("");
            setPhone("");
            setEmail("");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to add walk-in");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Walk-in Participant</DialogTitle>
                    <DialogDescription>
                        Add a participant who doesn't have a booking in the system
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter participant name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1234567890"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name.trim()}
                    >
                        {isSubmitting ? "Adding..." : "Add Participant"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

