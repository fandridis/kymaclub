import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, BookOpen, ExternalLink, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useActiveClassTemplates } from '../hooks/use-class-templates';
import type { Doc } from '@repo/api/convex/_generated/dataModel';
import { Link } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DateTimePicker } from "@/components/ui/datetime-picker";

export interface CreateInstanceFromTemplateDialogProps {
    /** Whether the drawer is open */
    open: boolean;
    /** Date and time selected from the calendar cell */
    selectedDateTime: string; // ISO string format: "2024-01-15T09:30"
    /** Function to close the drawer */
    onClose: () => void;
}

// Days of the week with their indexes (0 = Sunday)
const DAYS_OF_WEEK = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 0 },
];

/**
 * Drawer for creating a class instance from a template when clicking on a calendar cell
 */
export function CreateInstanceFromTemplateDialog({
    open,
    selectedDateTime,
    onClose,
}: CreateInstanceFromTemplateDialogProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [scheduledDateTime, setScheduledDateTime] = useState(selectedDateTime);
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
    const [weeks, setWeeks] = useState<number>(2);
    const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // All days selected by default
    const [isCreating, setIsCreating] = useState(false);

    const createClassInstance = useMutation(api.mutations.classInstances.createClassInstance);
    const createMultipleClassInstances = useMutation(api.mutations.classInstances.createMultipleClassInstances);

    const { classTemplates, loading: isLoadingTemplates } = useActiveClassTemplates();

    // Update scheduled date time when selected date time changes
    useEffect(() => {
        setScheduledDateTime(selectedDateTime);
    }, [selectedDateTime]);

    const selectedTemplate = classTemplates.find(t => t._id === selectedTemplateId);

    // Check if the selected date is in the past
    const isDateInPast = scheduledDateTime ? new Date(scheduledDateTime) < new Date() : false;

    // Calculate count based on frequency and weeks
    const calculateCount = (frequency: 'daily' | 'weekly', weeks: number): number => {
        if (frequency === 'daily') {
            return weeks * selectedDaysOfWeek.length; // Number of selected days per week * weeks
        } else if (frequency === 'weekly') {
            return weeks; // 1 instance per week
        }
        return 1;
    };

    // Handle day of week checkbox change
    const handleDayToggle = (dayValue: number, checked: boolean) => {
        if (checked) {
            setSelectedDaysOfWeek(prev => [...prev, dayValue].sort());
        } else {
            setSelectedDaysOfWeek(prev => prev.filter(day => day !== dayValue));
        }
    };

    const handleScheduleClass = async () => {
        if (!selectedTemplate || !scheduledDateTime) {
            return;
        }

        setIsCreating(true);

        try {
            const startTime = new Date(scheduledDateTime).getTime();

            if (isRecurring) {
                const count = calculateCount(frequency, weeks);

                try {
                    await createMultipleClassInstances({
                        templateId: selectedTemplate._id,
                        startTime: startTime,
                        frequency: frequency,
                        weeks: weeks,
                        duration: selectedTemplate.duration,
                        selectedDaysOfWeek: frequency === 'daily' ? selectedDaysOfWeek : undefined,
                    });

                    toast.success(`Created ${count} instances of "${selectedTemplate.name}"`);
                    onClose();
                } catch (error) {
                    console.error('Failed to create class instance:', error);
                    toast.error('Failed to schedule class. Please try again.');
                }
            } else {
                // Create single instance
                try {
                    await createClassInstance({
                        templateId: selectedTemplate._id,
                        startTime,
                    });

                    toast.success(`"${selectedTemplate.name}" scheduled successfully!`);
                    onClose();
                } catch (error) {
                    console.error('Failed to create class instance:', error);
                    toast.error('Failed to schedule class. Please try again.');
                }
            }
        } catch (error) {
            console.error('Failed to create class instance:', error);
            toast.error('Failed to schedule class. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const renderEmptyState = () => (
        <Card className="text-center py-8">
            <CardContent>
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                    You need to create class templates before you can schedule classes
                </p>
                <Button asChild variant="outline">
                    <Link to="/templates" className="inline-flex items-center gap-2">
                        Create Templates
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );

    // Generate weeks options (2-16)
    const weeksOptions = Array.from({ length: 15 }, (_, i) => i + 2);

    return (
        <Drawer open={open} onOpenChange={onClose} direction="right">
            <DrawerContent className="max-w-[500px] w-full h-full flex flex-col">
                <DrawerHeader className="text-left shrink-0">
                    <DrawerTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Schedule Class
                    </DrawerTitle>
                    <DrawerDescription>
                        Create a new class from one of your templates
                    </DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="space-y-4">

                        {/* Date and Time Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="datetime">Date & Time</Label>
                            <DateTimePicker
                                value={scheduledDateTime ? new Date(scheduledDateTime) : undefined}
                                onChange={(date) => setScheduledDateTime(date ? format(date, "yyyy-MM-dd'T'HH:mm") : "")}
                                placeholder="Select date and time"
                                className={isDateInPast ? "border-destructive" : ""}
                            />
                            {isDateInPast && (
                                <p className="text-sm text-destructive">
                                    The selected date and time is in the past.
                                </p>
                            )}
                        </div>

                        {/* Template Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="template">Class Template</Label>
                            {isLoadingTemplates ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-sm text-muted-foreground">Loading templates...</div>
                                </div>
                            ) : classTemplates.length === 0 ? (
                                renderEmptyState()
                            ) : (
                                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                    <SelectTrigger id="template" className={`w-full ${selectedTemplateId ? 'h-14!' : ''}`}>
                                        <SelectValue placeholder="Select a template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classTemplates.map((template: Doc<"classTemplates">) => (
                                            <SelectItem key={template._id} value={template._id}>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-medium">{template.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {template.instructor} • {template.duration}min • {template.capacity} people
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Recurring Toggle */}
                        <div className="mt-6 flex items-center space-x-2">
                            <Switch
                                id="recurring"
                                checked={isRecurring}
                                onCheckedChange={setIsRecurring}
                            />
                            <Label htmlFor="recurring" className="flex items-center gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Make this recurring
                            </Label>
                        </div>

                        {/* Recurring Options */}
                        {isRecurring && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                <div className="flex gap-4">
                                    <div className="space-y-2 flex-1">
                                        <Label htmlFor="frequency-select">Frequency</Label>
                                        <Select value={frequency} onValueChange={(value: 'daily' | 'weekly') => setFrequency(value)}>
                                            <SelectTrigger id="frequency-select" className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <Label htmlFor="weeks-select">Duration</Label>
                                        <Select value={weeks.toString()} onValueChange={(value) => setWeeks(parseInt(value))}>
                                            <SelectTrigger id="weeks-select" className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {weeksOptions.map((week) => (
                                                    <SelectItem key={week} value={week.toString()}>
                                                        {week} weeks
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Days of Week Selection (only for daily frequency) */}
                                {frequency === 'daily' && (
                                    <div className="space-y-2">
                                        <Label>Days of the week</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {DAYS_OF_WEEK.map((day) => (
                                                <div key={day.value} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`day-${day.value}`}
                                                        checked={selectedDaysOfWeek.includes(day.value)}
                                                        onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                                                    />
                                                    <Label
                                                        htmlFor={`day-${day.value}`}
                                                        className="text-sm font-normal cursor-pointer"
                                                    >
                                                        {day.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                        {selectedDaysOfWeek.length === 0 && (
                                            <p className="text-sm text-destructive">
                                                Please select at least one day of the week.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t bg-background flex gap-2 shrink-0">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleScheduleClass}
                        disabled={
                            !selectedTemplate ||
                            !scheduledDateTime ||
                            classTemplates.length === 0 ||
                            isCreating ||
                            isDateInPast ||
                            (isRecurring && frequency === 'daily' && selectedDaysOfWeek.length === 0)
                        }
                        className="flex-1"
                    >
                        {isCreating ? 'Scheduling...' : (isRecurring ? 'Schedule Series' : 'Schedule Class')}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
} 