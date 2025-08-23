import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@repo/api/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import type { Doc } from '@repo/api/convex/_generated/dataModel';
import { useIsMobile } from '@/hooks/use-mobile';
import ConfirmDeleteInstancesDialog from './confirm-delete-multiple-instances-dialog';
import { dbTimestampToBusinessDate } from '@/lib/timezone-utils';
import { ConvexError } from 'convex/values';

export interface DeleteEventDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Event to delete */
  event: Doc<"classInstances">;
  /** Function to close the dialog */
  onClose: () => void;
  /** Callback when user chooses to delete */
  onDeleteSuccess: ({ mode }: { mode: 'single' | 'similar' }) => void;
  /** Business timezone for proper date formatting */
  businessTimezone: string;
}

export function DeleteEventDialog({
  open,
  onClose,
  event,
  onDeleteSuccess,
  businessTimezone,
}: DeleteEventDialogProps) {
  const eventId = event._id;
  const eventName = event.name;
  const startTime = event.startTime;
  const endTime = event.endTime;
  const isMobile = useIsMobile();

  const deleteSingleInstance = useMutation(api.mutations.classInstances.deleteSingleInstance);
  const deleteSimilarFutureInstances = useMutation(api.mutations.classInstances.deleteSimilarFutureInstances);

  // Fetch similar instances to show count in button and pass to confirmation dialog
  const similarInstances = useQuery(
    api.queries.classInstances.getSimilarClassInstances,
    open ? { instanceId: eventId } : "skip"
  );

  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);

  const isLoadingSimilar = similarInstances === undefined;
  const similarInstancesCount = similarInstances?.length ?? 0;
  const hasSimilarFutureEvents = similarInstancesCount > 0;

  // Calculate button text and handler based on toggle state
  const totalEvents = similarInstancesCount + 1;
  const buttonText = applyToAll ? `Delete ${totalEvents} events` : "Delete event";
  const isDeleting = isDeletingSingle || isDeletingMultiple;

  const handleDeleteSingle = async () => {
    setIsDeletingSingle(true);
    try {
      await deleteSingleInstance({ instanceId: eventId });
      onDeleteSuccess({ mode: 'single' });
    } catch (error) {
      if (error instanceof ConvexError) {
        console.log('Error.data:', error.data);
        toast.error(error.data.message);
      } else {
        console.error('Failed to delete event:', error);
        toast.error('Failed to delete event. Please try again.');
      }
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleDeleteSimilarFutureClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDeleteSimilarFuture = async () => {
    setIsDeletingMultiple(true);
    try {
      await deleteSimilarFutureInstances({ instanceId: eventId });
      onDeleteSuccess({ mode: 'similar' });
    } catch (error) {
      if (error instanceof ConvexError) {
        console.log('Error.data:', error.data);
        toast.error(error.data.message);
      } else {
        console.error('Failed to delete event:', error);
        toast.error('Failed to delete event. Please try again.');
      }
    } finally {
      setIsDeletingMultiple(false);
    }
    setShowConfirmDialog(false);
  };

  const handleDeleteClick = () => {
    if (applyToAll && hasSimilarFutureEvents) {
      handleDeleteSimilarFutureClick();
    } else {
      handleDeleteSingle();
    }
  };

  return (
    <>
      <Drawer direction={isMobile ? "bottom" : "right"} open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}>
        <DrawerContent className="flex flex-col h-screen">
          <DrawerHeader className="h-[64px] border-b">
            <DrawerTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Event
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You're about to delete an event. This action cannot be undone.
              </p>

              {/* Event Information */}
              <div className="rounded-lg border p-4 bg-muted/30">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Event Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-base">{eventName}</div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(dbTimestampToBusinessDate(startTime, businessTimezone), "EEEE, MMMM do, yyyy")} at {formatEventTimeRange(startTime, endTime, businessTimezone)}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    Instructor: {event.instructor}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="flex-col gap-2 pt-4 border-t flex-shrink-0">
            {hasSimilarFutureEvents && !isLoadingSimilar && (
              <div className="flex items-center space-x-2 px-1 mb-2">
                <Switch
                  id="apply-to-all-delete"
                  checked={applyToAll}
                  onCheckedChange={setApplyToAll}
                  disabled={isDeleting}
                />
                <Label htmlFor="apply-to-all-delete" className="text-sm font-medium">
                  Apply to all future events
                </Label>
              </div>
            )}

            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting ? 'Deleting...' : buttonText}
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isDeleting}
              className="w-full"
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ConfirmDeleteInstancesDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmDeleteSimilarFuture}
        onCancel={() => setShowConfirmDialog(false)}
        isDeleting={isDeletingMultiple}
        similarInstances={similarInstances || []}
        businessTimezone={businessTimezone}
      />
    </>
  );
}

/**
 * Utilities
 */
const formatEventTimeRange = (startTime: number, endTime: number, businessTimezone: string) => {
  const start = dbTimestampToBusinessDate(startTime, businessTimezone);
  const end = dbTimestampToBusinessDate(endTime, businessTimezone);

  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
}
