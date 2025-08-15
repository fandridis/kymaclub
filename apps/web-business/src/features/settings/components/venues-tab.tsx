import { useVenues } from '@/features/venues/hooks/use-venues';
import { SpinningCircles } from '@/components/spinning-circles';
import { Card, CardContent } from '@/components/ui/card';
import { CreateVenueDialog } from '@/features/venues/components/create-venue-dialog';
import { DeleteVenueDialog } from '@/features/venues/components/delete-venue-dialog';
import { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { VenueCard } from '@/features/venues/components/venue-card';

export function VenuesTab() {
    const { venues, loading } = useVenues();
    const [editingVenue, setEditingVenue] = useState<any>(null);
    const [deletingVenue, setDeletingVenue] = useState<any>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <SpinningCircles />
            </div>
        );
    }

    if (venues.length === 0) {
        return (
            <div className="text-center py-16">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
                <p className="text-muted-foreground mb-6">
                    Add your first location to start managing your business venues.
                </p>
                <CreateVenueDialog />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Your Venues</h3>
                    <p className="text-sm text-muted-foreground">
                        These are the places where you teach your classes. If all your classes are at the same location, you don't need to add any more venues. You can update your existing venue with new details, services provided, etc.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {venues.map((venue) => (
                    <VenueCard
                        key={venue._id}
                        venue={venue}
                        onEdit={() => setEditingVenue(venue)}
                        onDelete={() => setDeletingVenue(venue)}
                    />
                ))}

                {/* Add Venue Card */}
                <Card
                    key="add-venue-card"
                    onClick={() => setIsCreateOpen(true)}
                    className="border-2 border-dashed shadow-none cursor-pointer transition-colors hover:bg-muted/30"
                >
                    <CardContent className="h-full flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Plus className="h-4 w-4" />
                            Add another venue
                        </div>
                    </CardContent>
                </Card>
            </div>

            {editingVenue && (
                <CreateVenueDialog
                    venue={editingVenue}
                    isOpen={!!editingVenue}
                    onClose={() => setEditingVenue(null)}
                />
            )}

            {deletingVenue && (
                <DeleteVenueDialog
                    venue={deletingVenue}
                    hideTrigger={true}
                    isOpen={!!deletingVenue}
                    onClose={() => setDeletingVenue(null)}
                />
            )}

            {isCreateOpen && (
                <CreateVenueDialog
                    hideTrigger={true}
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                />
            )}
        </div>
    );
}