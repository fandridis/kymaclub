import React, { useState } from 'react';
import { Plus, Clock, Users, BookOpen, Tag, X, User, Palette } from 'lucide-react';
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import type { Doc, Id } from "@repo/api/convex/_generated/dataModel";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from 'react';
import { getDurationOptions } from '@/features/calendar/utils/duration';
import { ConvexError } from 'convex/values';
import { useVenues } from '@/features/venues/hooks/use-venues';

const COLOR_OPTIONS = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Yellow' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#F97316', label: 'Orange' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#84CC16', label: 'Lime' },
];

const createTemplateSchema = z.object({
    // Class Details
    name: z.string().min(1, "Class name is required"),
    instructor: z.string().min(1, "Instructor name is required"),
    description: z.string().optional(),
    tags: z.array(z.string()),
    color: z.string().optional(),
    venueId: z.string().min(1, "Venue is required"),

    // Class Settings
    duration: z.string().min(1, "Duration is required"),

    // Booking Rules
    capacity: z.string().min(1, "Capacity is required").refine((val) => parseInt(val) > 0, "Capacity must be greater than 0"),
    baseCredits: z.string().min(1, "Base credits is required").refine((val) => parseInt(val) > 0, "Base credits must be greater than 0"),
    allowWaitlist: z.boolean(),
    waitlistCapacity: z.string().optional(),
    bookingWindowMinHours: z.string().min(1, "Minimum booking hours is required").refine((val) => parseInt(val) >= 0, "Minimum booking hours must be 0 or greater"),
    bookingWindowMaxHours: z.string().min(1, "Maximum booking hours is required").refine((val) => parseInt(val) > 0, "Maximum booking hours must be greater than 0"),
    cancellationWindowHours: z.string().optional(),
}).refine((data) => {
    const minHours = parseInt(data.bookingWindowMinHours);
    const maxHours = parseInt(data.bookingWindowMaxHours);
    return maxHours > minHours;
}, {
    message: "Maximum booking hours must be greater than minimum",
    path: ["bookingWindowMaxHours"],
})

export type FormData = z.infer<typeof createTemplateSchema>;

interface CreateTemplateDialogProps {
    classTemplate?: Doc<"classTemplates">;
    isOpen?: boolean;
    hideTrigger?: boolean;
    onClose?: () => void;
}

export default function CreateTemplateDialog({ classTemplate, isOpen, hideTrigger, onClose }: CreateTemplateDialogProps) {
    const { venues } = useVenues();
    const [open, setOpen] = useState(isOpen ?? false);
    const [loading, setLoading] = useState(false);
    const [currentTag, setCurrentTag] = useState("");
    const createClassTemplate = useMutation(api.mutations.classTemplates.createClassTemplate);
    const updateClassTemplate = useMutation(api.mutations.classTemplates.updateClassTemplate);

    const isEditMode = !!classTemplate;

    const form = useForm<FormData>({
        resolver: zodResolver(createTemplateSchema),
        defaultValues: {
            name: "",
            instructor: "",
            description: "",
            venueId: "",
            tags: [],
            color: COLOR_OPTIONS[0]?.value,
            duration: '60',
            capacity: "15",
            baseCredits: "10",
            allowWaitlist: false,
            waitlistCapacity: "5",
            bookingWindowMinHours: "2",
            bookingWindowMaxHours: "168",
            cancellationWindowHours: "2",
        },
    });

    // Auto-select venue if only one exists and no venue is currently selected
    useEffect(() => {
        if (venues.length === 1 && !form.getValues("venueId") && !isEditMode) {
            form.setValue("venueId", venues[0]!._id);
        }
    }, [venues, form, isEditMode]);

    useEffect(() => {
        if (isEditMode && classTemplate) {
            form.reset({
                name: classTemplate!.name,
                instructor: classTemplate!.instructor,
                description: classTemplate!.description || "",
                venueId: classTemplate!.venueId || "",
                tags: classTemplate!.tags || [],
                color: classTemplate!.color || COLOR_OPTIONS[0]?.value,
                duration: classTemplate!.duration.toString(),
                capacity: classTemplate!.capacity.toString(),
                baseCredits: classTemplate!.baseCredits.toString(),
                allowWaitlist: classTemplate!.allowWaitlist || false,
                waitlistCapacity: classTemplate!.waitlistCapacity?.toString() || "5",
                bookingWindowMinHours: (classTemplate!.bookingWindow?.minHours || 2).toString(),
                bookingWindowMaxHours: (classTemplate!.bookingWindow?.maxHours || 168).toString(),
                cancellationWindowHours: classTemplate!.cancellationWindowHours?.toString() || "2",
            });
        }
    }, [isEditMode, classTemplate, form]);

    const resetForm = () => {
        form.reset();
        setCurrentTag("");
        setLoading(false);
        // Re-auto-select venue after reset if only one exists
        if (venues.length === 1 && !isEditMode) {
            form.setValue("venueId", venues[0]!._id);
        }
    };

    // Reset form when drawer closes
    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);

    const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && currentTag.trim()) {
            e.preventDefault();
            const currentTags = form.getValues("tags");
            if (!currentTags.includes(currentTag.trim())) {
                form.setValue("tags", [...currentTags, currentTag.trim()]);
            }
            setCurrentTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        const currentTags = form.getValues("tags");
        form.setValue("tags", currentTags.filter((tag) => tag !== tagToRemove));
    };


    const handleSubmit = async (data: FormData) => {
        setLoading(true);

        try {
            const templateData = {
                name: data.name.trim(),
                venueId: data.venueId as Id<"venues">,
                description: data.description?.trim(),
                instructor: data.instructor.trim(),
                duration: parseInt(data.duration),
                capacity: parseInt(data.capacity),
                baseCredits: parseInt(data.baseCredits),
                allowWaitlist: data.allowWaitlist,
                waitlistCapacity: data.allowWaitlist && data.waitlistCapacity
                    ? parseInt(data.waitlistCapacity)
                    : undefined,
                bookingWindow: {
                    minHours: parseInt(data.bookingWindowMinHours),
                    maxHours: parseInt(data.bookingWindowMaxHours)
                },
                cancellationWindowHours: data.cancellationWindowHours
                    ? parseInt(data.cancellationWindowHours)
                    : 0,
                tags: data.tags.length > 0 ? data.tags : undefined,
                color: data.color,
            };

            if (isEditMode) {
                await updateClassTemplate({
                    templateId: classTemplate._id,
                    template: {
                        ...templateData
                    }
                });
                toast.success("Class template updated successfully");
            } else {
                await createClassTemplate({ template: templateData });
                toast.success("Class template created successfully");
            }

            setOpen(false);
            onClose?.();
        } catch (error) {
            if (error instanceof ConvexError) {
                console.log('Error.data:', error.data);
                toast.error(error.data.message);
            } else {
                console.error(`Error ${isEditMode ? 'updating' : 'creating'} class template:`, error);
                toast.error(`Failed to ${isEditMode ? 'update' : 'create'} class template.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const formData = form.watch();

    return (
        <div className="p-8">
            {!hideTrigger && (
                <Button onClick={() => setOpen(true)} className="mb-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                </Button>
            )}

            <Drawer direction='right' open={open ?? isOpen} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    onClose?.();
                }
                setOpen(isOpen);
            }}>
                <DrawerContent className="w-full px-2 sm:max-w-lg overflow-y-auto">
                    <DrawerHeader className="pb-4">
                        <DrawerTitle className="text-left">
                            {isEditMode ? 'Edit Template' : 'Create Template'}
                        </DrawerTitle>
                        <DrawerDescription>
                            {isEditMode ? `Editing "${classTemplate!.name}" template` : 'Create a new class template that can be used to schedule recurring classes.'}
                        </DrawerDescription>
                    </DrawerHeader>

                    <Form {...form}>
                        <div className="space-y-6 pb-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                Class Name <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input autoFocus placeholder="e.g., Beginner Yoga" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="instructor" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Instructor <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Instructor name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="venueId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                Venue <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select venue" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {venues.map((venue) => (
                                                            <SelectItem key={venue._id} value={venue._id}>
                                                                {venue.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="duration" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Duration <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select duration" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {getDurationOptions().map(option => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>



                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Describe the class..." rows={3} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Tags
                                    </Label>
                                    <Input
                                        value={currentTag}
                                        onChange={(e) => setCurrentTag(e.target.value)}
                                        onKeyPress={handleTagKeyPress}
                                        placeholder="Type a tag and press Enter"
                                    />
                                    {formData.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {formData.tags.map((tag, index) => (
                                                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                                                    {tag}
                                                    <button type="button" onClick={() => removeTag(tag)} className="hover:bg-primary/20 rounded-full p-0.5">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>


                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="capacity" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Capacity <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" placeholder="Max participants" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="baseCredits" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Base Credits <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" placeholder="Credits to book" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="allowWaitlist" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel>Allow Waitlist</FormLabel>
                                    </FormItem>
                                )} />

                                {formData.allowWaitlist && (
                                    <FormField control={form.control} name="waitlistCapacity" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Waitlist Capacity</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" placeholder="Max waitlist spots" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="bookingWindowMinHours" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Min Hours <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="bookingWindowMaxHours" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Hours <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="cancellationWindowHours" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cancellation Window (Hours)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="color" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Palette className="h-4 w-4" />
                                            Color Theme
                                        </FormLabel>
                                        <div className="flex flex-wrap gap-3">
                                            {COLOR_OPTIONS.map((color) => (
                                                <button
                                                    key={color.value}
                                                    type="button"
                                                    onClick={() => field.onChange(color.value)}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${field.value === color.value
                                                        ? 'border-gray-900 scale-110'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                    style={{ backgroundColor: color.value }}
                                                    title={color.label}
                                                />
                                            ))}
                                        </div>
                                    </FormItem>
                                )} />

                            </div>
                        </div>
                    </Form>

                    <DrawerFooter className="flex-col gap-2 pt-4 border-t">
                        <Button
                            onClick={form.handleSubmit(handleSubmit)}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Template' : 'Create Template')}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => {
                                setOpen(false);
                                onClose?.();
                            }}
                            disabled={loading}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}