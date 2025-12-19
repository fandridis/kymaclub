import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { toast } from 'sonner';
import { format, parseISO, addMinutes } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CalendarPlus, AlertTriangle } from 'lucide-react';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from '@tanstack/react-router';

interface CreateClassDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDateTime?: string;
    businessTimezone: string;
}

const createClassSchema = z.object({
    venueId: z.string().min(1, 'Please select a venue'),
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().optional(),
    shortDescription: z.string().max(200).optional(),
    instructor: z.string().optional(),
    duration: z.number().min(15).max(480),
    capacity: z.number().min(1).max(100),
    price: z.number().min(0).max(100000),
    startDate: z.string(),
    startTime: z.string(),
    isRecurring: z.boolean(),
    recurringFrequency: z.enum(['weekly', 'biweekly']).optional(),
    recurringOccurrences: z.number().min(1).max(12).optional(),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

export function CreateClassDialog({
    open,
    onOpenChange,
    selectedDateTime,
    businessTimezone,
}: CreateClassDialogProps) {
    const createClass = useMutation(api.mutations.classInstances.createClass);
    const venues = useQuery(api.queries.venues.getVenues);
    const business = useQuery(api.queries.businesses.getMyBusiness);
    const navigate = useNavigate();

    const isPaymentEnabled = business?.stripeConnectedAccountStatus === 'enabled';

    // Parse selected date/time
    const defaultDate = selectedDateTime
        ? format(parseISO(selectedDateTime), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
    const defaultTime = selectedDateTime
        ? format(parseISO(selectedDateTime), 'HH:mm')
        : '09:00';

    const form = useForm<CreateClassForm>({
        resolver: zodResolver(createClassSchema),
        defaultValues: {
            venueId: '',
            name: '',
            description: '',
            shortDescription: '',
            instructor: '',
            duration: 60,
            capacity: 10,
            price: 1500, // €15 in cents
            startDate: defaultDate,
            startTime: defaultTime,
            isRecurring: false,
            recurringFrequency: 'weekly',
            recurringOccurrences: 4,
        },
    });

    const isRecurring = form.watch('isRecurring');

    const handleSubmit = async (data: CreateClassForm) => {
        try {
            // Calculate start and end times
            const startDateTime = parseISO(`${data.startDate}T${data.startTime}`);
            const duration = data.duration || 60;
            const endDateTime = addMinutes(startDateTime, duration);

            const result = await createClass({
                venueId: data.venueId as Id<"venues">,
                name: data.name,
                startTime: startDateTime.getTime(),
                timezone: businessTimezone,
                price: data.price,
                capacity: data.capacity,
                description: data.description || undefined,
                shortDescription: data.shortDescription || undefined,
                instructor: data.instructor || undefined,
                duration: data.duration,
                recurring: data.isRecurring && data.recurringFrequency && data.recurringOccurrences
                    ? {
                        frequency: data.recurringFrequency,
                        occurrences: data.recurringOccurrences,
                    }
                    : undefined,
            });

            toast.success(
                result.createdInstanceIds.length > 1
                    ? `Created ${result.createdInstanceIds.length} workshops`
                    : 'Workshop created successfully',
                {
                    description: !isPaymentEnabled
                        ? "Note: Bookings are disabled until payment setup is complete."
                        : undefined
                }
            );

            onOpenChange(false);
            form.reset();
        } catch (error) {
            console.error('Failed to create workshop:', error);
            toast.error('Failed to create workshop');
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarPlus className="h-5 w-5" />
                        Create Workshop
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
                    {!isPaymentEnabled && business && (
                        <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <AlertTitle className="text-yellow-800">Payments not set up</AlertTitle>
                            <AlertDescription className="text-yellow-700">
                                Bookings will be disabled for this class until you <span
                                    className="underline cursor-pointer font-medium hover:text-yellow-900"
                                    onClick={() => {
                                        onOpenChange(false);
                                        navigate({ to: '/earnings' });
                                    }}
                                >
                                    complete payment setup
                                </span>.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Venue Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="venueId">Venue *</Label>
                        <Select
                            value={form.watch('venueId')}
                            onValueChange={(value) => form.setValue('venueId', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a venue" />
                            </SelectTrigger>
                            <SelectContent>
                                {venues?.map((venue) => (
                                    <SelectItem key={venue._id} value={venue._id}>
                                        {venue.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.venueId && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.venueId.message}
                            </p>
                        )}
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Workshop Name *</Label>
                        <Input
                            id="name"
                            {...form.register('name')}
                            placeholder="e.g., Wine & Paint Night"
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* Instructor */}
                    <div className="space-y-2">
                        <Label htmlFor="instructor">Host / Instructor</Label>
                        <Input
                            id="instructor"
                            {...form.register('instructor')}
                            placeholder="e.g., Maria Garcia"
                        />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Date *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                {...form.register('startDate')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Time *</Label>
                            <Input
                                id="startTime"
                                type="time"
                                {...form.register('startTime')}
                            />
                        </div>
                    </div>

                    {/* Duration and Capacity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes) *</Label>
                            <Input
                                id="duration"
                                type="number"
                                min={15}
                                max={480}
                                {...form.register('duration', { valueAsNumber: true })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity">Capacity *</Label>
                            <Input
                                id="capacity"
                                type="number"
                                min={1}
                                max={100}
                                {...form.register('capacity', { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <Label htmlFor="price">Price (in cents) *</Label>
                        <Input
                            id="price"
                            type="number"
                            min={0}
                            max={100000}
                            {...form.register('price', { valueAsNumber: true })}
                        />
                        <p className="text-xs text-muted-foreground">
                            = €{((form.watch('price') || 0) / 100).toFixed(2)}
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...form.register('description')}
                            placeholder="Describe your workshop..."
                            rows={3}
                        />
                    </div>

                    {/* Recurring Options */}
                    <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isRecurring"
                                checked={isRecurring}
                                onCheckedChange={(checked) =>
                                    form.setValue('isRecurring', checked === true)
                                }
                            />
                            <Label htmlFor="isRecurring" className="cursor-pointer">
                                Make this a recurring workshop
                            </Label>
                        </div>

                        {isRecurring && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Frequency</Label>
                                    <Select
                                        value={form.watch('recurringFrequency')}
                                        onValueChange={(value: 'weekly' | 'biweekly') =>
                                            form.setValue('recurringFrequency', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Occurrences</Label>
                                    <Select
                                        value={form.watch('recurringOccurrences')?.toString()}
                                        onValueChange={(value) =>
                                            form.setValue('recurringOccurrences', parseInt(value))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[2, 4, 6, 8, 10, 12].map((num) => (
                                                <SelectItem key={num} value={num.toString()}>
                                                    {num} times
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : isRecurring ? (
                                `Create ${form.watch('recurringOccurrences') || 1} Workshops`
                            ) : (
                                'Create Workshop'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
