import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@repo/api/convex/_generated/api";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useState } from "react";

export function DeleteVenueDialog({ venue, hideTrigger, isOpen, onClose }: { venue: Doc<"venues">, hideTrigger: boolean, isOpen: boolean, onClose: () => void }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteVenue = useMutation(api.mutations.venues.deleteVenue);

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteVenue({ venueId: venue._id });
            toast.success("Venue deleted successfully");
            onClose();
        } catch (error) {
            if (error instanceof ConvexError) {
                toast.error(error.data.message);
            } else {
                toast.error("Failed to delete venue");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            {!hideTrigger && (
                <AlertDialogTrigger>
                    <Button variant="destructive">Delete Venue</Button>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Venue</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete {venue.name}?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>Delete</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}   