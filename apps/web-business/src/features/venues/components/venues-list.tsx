import { SpinningCircles } from "@/components/spinning-circles";
import { useVenues } from "../hooks/use-venues";
import { VenueCard } from "./venue-card";
import { CreateVenueDialog } from "./create-venue-dialog";
import { useState } from "react";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import { DeleteVenueDialog } from "./delete-venue-dialog";

export function VenuesList() {
    const { venues, loading } = useVenues();
    const [editingVenue, setEditingVenue] = useState<Doc<"venues"> | undefined>();
    const [deletingVenue, setDeletingVenue] = useState<Doc<"venues"> | undefined>();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <SpinningCircles />
            </div>
        );
    }

    if (venues.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No venues found. Please create a venue.
                <CreateVenueDialog />
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {venues.map((venue) => (
                <VenueCard key={venue._id} venue={venue} onEdit={() => setEditingVenue(venue)} onDelete={() => setDeletingVenue(venue)} />
            ))}
            {editingVenue && (
                <CreateVenueDialog
                    isOpen={!!editingVenue}
                    venue={editingVenue}
                    hideTrigger
                    onClose={() => setEditingVenue(undefined)}
                />
            )}
            {deletingVenue && (
                <DeleteVenueDialog
                    venue={deletingVenue}
                    isOpen={!!deletingVenue}
                    hideTrigger
                    onClose={() => setDeletingVenue(undefined)}
                />
            )}
        </div>
    );
}
