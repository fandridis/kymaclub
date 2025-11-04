import { useVenues } from '@/features/venues/hooks/use-venues';
import { SpinningCircles } from '@/components/spinning-circles';
import { Button } from '@/components/ui/button';
import { CreateVenueDialog } from '@/features/venues/components/create-venue-dialog';
import { DeleteVenueDialog } from '@/features/venues/components/delete-venue-dialog';
import { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { VenueCard } from '@/features/venues/components/venue-card';
import { useTypedTranslation } from '@/lib/typed';

export function VenuesTab() {
    const { venues, loading } = useVenues();
    const { t } = useTypedTranslation();
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
                <h3 className="text-lg font-semibold mb-2">{t('routes.settings.noLocationsYet')}</h3>
                <p className="text-muted-foreground mb-6">
                    {t('routes.settings.addFirstLocation')}
                </p>
                <CreateVenueDialog />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{t('routes.settings.yourVenues')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('routes.settings.yourVenuesDescription')}
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

                {/* Add Venue Button */}
                <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(true)}
                    className="h-full min-h-[120px] border-2 border-dashed shadow-none transition-colors hover:bg-muted/30"
                    aria-label={t('routes.settings.addAnotherVenue')}
                >
                    <Plus className="h-4 w-4" />
                    {t('routes.settings.addAnotherVenue')}
                </Button>
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