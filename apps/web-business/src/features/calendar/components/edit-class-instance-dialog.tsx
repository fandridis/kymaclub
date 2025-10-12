"use client"

import React, { useState, useEffect } from 'react';
import { Clock, Users, BookOpen, Tag, X, User, Palette, Calendar } from 'lucide-react';
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from 'date-fns';

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EuroPriceInput } from "@/components/euro-price-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";
import type { Doc } from '@repo/api/convex/_generated/dataModel';
import { getDurationOptions } from '@/features/calendar/utils/duration';
import { useIsMobile } from '@/hooks/use-mobile';
import ConfirmUpdateInstancesDialog from './confirm-update-multiple-instances-dialog';
import { dbTimestampToBusinessDate, businessDateToDbTimestamp } from '@/lib/timezone-utils';
import { TEMPLATE_COLORS, TEMPLATE_COLORS_ARRAY } from '@repo/utils/colors';
import { cn } from '@/lib/utils';
import { TEMPLATE_COLORS_MAP } from '@/utils/colors';
import { ClassDiscountRulesForm } from '@/components/class-discount-rules-form';

// Define the discount rule schema for form validation
const discountRuleSchema = z.object({
    id: z.string(),
    name: z.string(),
    condition: z.object({
        type: z.union([z.literal("hours_before_min"), z.literal("hours_before_max"), z.literal("always")]),
        hours: z.number().optional(),
    }),
    discount: z.object({
        type: z.literal("fixed_amount"),
        value: z.number(),
    }),
    // Note: createdAt, createdBy, updatedAt, updatedBy will be set on the server
});

const editInstanceSchema = z.object({
    // Class Details
    name: z.string().min(1, "Class name is required"),
    instructor: z.string().min(1, "Instructor name is required"),
    description: z.string().optional(),
    tags: z.array(z.string()),
    color: z.string().optional(),

    // Timing
    startTime: z.string().min(1, "Start time is required"),
    duration: z.string().min(1, "Duration is required"),

    // Booking Rules
    capacity: z.string().min(1, "Capacity is required").refine((val) => parseInt(val) > 0, "Capacity must be greater than 0"),
    price: z.string().min(1, "Price is required").refine((val) => {
        const priceInCents = parseInt(val);
        return priceInCents >= 100 && priceInCents <= 10000;
    }, "Price must be between €1.00 and €100.00"),

    // Booking Window Toggle
    enableBookingWindow: z.boolean(),
    bookingWindowMinHours: z.string().optional(),
    bookingWindowMaxHours: z.string().optional(),

    // Refund Policy Toggle
    enableRefundPolicy: z.boolean(),
    cancellationWindowHours: z.string().optional(),


    // Discount Rules
    discountRules: z.array(discountRuleSchema).optional(),
}).refine((data) => {
    if (data.enableBookingWindow) {
        const minHours = parseInt(data.bookingWindowMinHours || "0");
        const maxHours = parseInt(data.bookingWindowMaxHours || "0");
        return maxHours > minHours;
    }
    return true;
}, {
    message: "Maximum booking hours must be greater than minimum",
    path: ["bookingWindowMaxHours"],
}).refine((data) => {
    const duration = parseInt(data.duration);
    return duration > 0;
}, {
    message: "Duration must be greater than 0 minutes",
    path: ["duration"],
});

type DiscountRule = z.infer<typeof discountRuleSchema>;

export type FormData = z.infer<typeof editInstanceSchema>;

interface EditClassInstanceDialogProps {
    open: boolean;
    instance: Doc<"classInstances"> | null;
    onClose: () => void;
    businessTimezone: string;
}

export default function EditClassInstanceDialog({ open, instance, onClose, businessTimezone }: EditClassInstanceDialogProps) {
    const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);
    const [isSubmittingMultiple, setIsSubmittingMultiple] = useState(false);
    const [currentTag, setCurrentTag] = useState("");
    const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
    const [applyToAll, setApplyToAll] = useState(false);
    const isMobile = useIsMobile();

    const updateSingleInstance = useMutation(api.mutations.classInstances.updateSingleInstance);
    const updateMultipleInstances = useMutation(api.mutations.classInstances.updateMultipleInstances);

    // Fetch similar instances to show count in button and pass to confirmation dialog
    const similarInstances = useQuery(
        api.queries.classInstances.getSimilarClassInstances,
        open && instance ? { instanceId: instance._id } : "skip"
    );

    const isLoadingSimilar = similarInstances === undefined;
    const similarInstancesCount = similarInstances?.length ?? 0;
    const hasSimilarInstances = similarInstancesCount > 0;

    // Calculate button text and handler based on toggle state
    const totalClasses = similarInstancesCount + 1;
    const buttonText = applyToAll ? `Update ${totalClasses} classes` : "Update class";
    const isSubmitting = isSubmittingSingle || isSubmittingMultiple;

    const form = useForm<FormData>({
        resolver: zodResolver(editInstanceSchema),
        defaultValues: {
            name: "",
            instructor: "",
            description: "",
            tags: [],
            color: TEMPLATE_COLORS.Green,
            startTime: "",
            duration: "60", // Default to 60 minutes
            capacity: "15",
            price: "1000", // 10 euros in cents
            enableBookingWindow: false,
            bookingWindowMinHours: "2",
            bookingWindowMaxHours: "168",
            enableRefundPolicy: false,
            cancellationWindowHours: "2",
            discountRules: [],
        },
    });

    // Populate form when instance data loads
    useEffect(() => {
        if (instance) {
            // Calculate duration in minutes from startTime and endTime
            const durationInMinutes = (instance.endTime - instance.startTime) / (1000 * 60);

            // Convert UTC timestamps to business timezone for form display
            const startTimeInBusinessTz = dbTimestampToBusinessDate(instance.startTime, businessTimezone);

            form.reset({
                name: instance.name || "",
                instructor: instance.instructor || "",
                description: instance.description || "",
                tags: instance.tags || [],
                color: instance.color || TEMPLATE_COLORS.Green,
                startTime: format(startTimeInBusinessTz, "yyyy-MM-dd'T'HH:mm"),
                duration: durationInMinutes.toString(),
                capacity: instance.capacity?.toString() || "15",
                price: instance.price?.toString() || "1000", // Default to 10 euros in cents
                enableBookingWindow: !!(instance.bookingWindow?.minHours || instance.bookingWindow?.maxHours),
                bookingWindowMinHours: (instance.bookingWindow?.minHours || 2).toString(),
                bookingWindowMaxHours: (instance.bookingWindow?.maxHours || 168).toString(),
                enableRefundPolicy: !!(instance.cancellationWindowHours && instance.cancellationWindowHours > 0),
                cancellationWindowHours: instance.cancellationWindowHours?.toString() || "2",
                discountRules: instance.discountRules || [],
            });
            // Also update the discount rules state
            setDiscountRules(instance.discountRules || []);
        }
    }, [instance, form, businessTimezone]);

    const resetForm = () => {
        form.reset();
        setCurrentTag("");
        setDiscountRules([]);
        setIsSubmittingSingle(false);
        setIsSubmittingMultiple(false);
        setApplyToAll(false);
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

    const handleUpdateSingle = async (data: FormData) => {
        if (!instance) return;

        setIsSubmittingSingle(true);

        try {
            // Convert business timezone input back to UTC for database storage
            const startTime = businessDateToDbTimestamp(new Date(data.startTime), businessTimezone);
            const durationMs = parseInt(data.duration) * 60 * 1000; // Convert minutes to milliseconds
            const endTime = startTime + durationMs;

            await updateSingleInstance({
                instanceId: instance._id,
                instance: {
                    startTime,
                    endTime,
                    name: data.name.trim(),
                    description: data.description?.trim(),
                    instructor: data.instructor.trim(),
                    capacity: parseInt(data.capacity),
                    price: parseInt(data.price),
                    bookingWindow: data.enableBookingWindow ? {
                        minHours: parseInt(data.bookingWindowMinHours || "0"),
                        maxHours: parseInt(data.bookingWindowMaxHours || "0")
                    } : undefined,
                    cancellationWindowHours: data.enableRefundPolicy && data.cancellationWindowHours
                        ? parseInt(data.cancellationWindowHours)
                        : 0,
                    tags: data.tags.length > 0 ? data.tags : undefined,
                    color: data.color,
                    discountRules: discountRules.length > 0 ? discountRules.map(rule => ({
                        id: rule.id,
                        name: rule.name,
                        condition: rule.condition,
                        discount: rule.discount,
                    })) : [],
                }
            });

            toast.success("Class updated successfully!");
            onClose();
        } catch (error) {
            console.error('Error updating class:', error);
            toast.error("Failed to update class.");
        } finally {
            setIsSubmittingSingle(false);
        }
    };

    const handleUpdateMultiple = async (data: FormData) => {
        if (!instance) return;

        setIsSubmittingMultiple(true);

        try {
            // Convert business timezone input back to UTC for database storage
            const startTime = businessDateToDbTimestamp(new Date(data.startTime), businessTimezone);
            const durationMs = parseInt(data.duration) * 60 * 1000; // Convert minutes to milliseconds
            const endTime = startTime + durationMs;

            const result = await updateMultipleInstances({
                instanceId: instance._id,
                instance: {
                    startTime,
                    endTime,
                    name: data.name.trim(),
                    description: data.description?.trim(),
                    instructor: data.instructor.trim(),
                    capacity: parseInt(data.capacity),
                    price: parseInt(data.price),
                    bookingWindow: data.enableBookingWindow ? {
                        minHours: parseInt(data.bookingWindowMinHours || "0"),
                        maxHours: parseInt(data.bookingWindowMaxHours || "0")
                    } : undefined,
                    cancellationWindowHours: data.enableRefundPolicy && data.cancellationWindowHours
                        ? parseInt(data.cancellationWindowHours)
                        : 0,
                    tags: data.tags.length > 0 ? data.tags : undefined,
                    color: data.color,
                    discountRules: discountRules.length > 0 ? discountRules.map(rule => ({
                        id: rule.id,
                        name: rule.name,
                        condition: rule.condition,
                        discount: rule.discount,
                    })) : [],
                }
            });
            toast.success(`Updated ${result.totalUpdated} similar classes successfully!`);

            onClose();
        } catch (error) {
            console.error('Error updating multiple classes:', error);
            toast.error("Failed to update similar classes.");
        } finally {
            setIsSubmittingMultiple(false);
        }
    };

    const handleMultipleUpdateClick = (data: FormData) => {
        setPendingFormData(data);
        setShowConfirmDialog(true);
    };

    const handleConfirmMultipleUpdate = () => {
        if (pendingFormData) {
            handleUpdateMultiple(pendingFormData);
        }
        setShowConfirmDialog(false);
        setPendingFormData(null);
    };

    const handleUpdateClick = (data: FormData) => {
        if (applyToAll && hasSimilarInstances) {
            handleMultipleUpdateClick(data);
        } else {
            handleUpdateSingle(data);
        }
    };

    if (!instance) return null;

    const formData = form.watch();

    return (
        <>
            <Drawer direction={isMobile ? "bottom" : "right"} open={open} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    onClose();
                }
            }}>
                <DrawerContent className="flex flex-col h-screen data-[vaul-drawer-direction=right]:sm:max-w-md">
                    <DrawerHeader className="h-[64px] border-b">
                        <DrawerTitle className="text-xl">Edit Class</DrawerTitle>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto">
                        <ScrollArea className="h-full p-4">
                            <Form {...form}>
                                <div className="space-y-6 pb-6">
                                    {/* Basic Information Section */}
                                    <div className="mt-8 space-y-4">
                                        <FormField control={form.control} name="startTime" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    Start Time <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <DateTimePicker
                                                        value={field.value ? new Date(field.value) : undefined}
                                                        onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd'T'HH:mm") : "")}
                                                        placeholder="Select date and time"
                                                    />
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
                                                <FormControl>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select duration" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {getDurationOptions().map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="name" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <BookOpen className="h-4 w-4" />
                                                            Class Name <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g., Beginner Yoga" {...field} />
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
                                                    onKeyDown={handleTagKeyPress}
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
                                        </div>
                                    </div>

                                    {/* Capacity & Credits Section */}
                                    <div className="space-y-4">
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

                                            <FormField control={form.control} name="price" render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <EuroPriceInput
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            onBlur={field.onBlur}
                                                            name={field.name}
                                                            required
                                                            error={form.formState.errors.price?.message}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                        {/* Booking Window Section */}
                                        <div className="space-y-4">
                                            <FormField control={form.control} name="enableBookingWindow" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <Settings className="h-4 w-4" />
                                                        Booking Window
                                                    </FormLabel>
                                                </FormItem>
                                            )} />

                                            {formData.enableBookingWindow && (
                                                <div className="space-y-3 pl-6 border-l-2 border-muted">
                                                    <FormField control={form.control} name="bookingWindowMaxHours" render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium min-w-[120px]">Open bookings</span>
                                                                    <Input type="number" min="1" className="w-20" {...field} />
                                                                    <span className="text-sm text-muted-foreground">hours before class</span>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />

                                                    <FormField control={form.control} name="bookingWindowMinHours" render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium min-w-[120px]">Close bookings</span>
                                                                    <Input type="number" min="0" className="w-20" {...field} />
                                                                    <span className="text-sm text-muted-foreground">hours before class</span>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    <div className="mt-8">
                                        <FormField control={form.control} name="color" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Palette className="h-4 w-4" />
                                                    Color Theme
                                                </FormLabel>
                                                <div className="pl-1 flex flex-wrap gap-2">
                                                    {TEMPLATE_COLORS_ARRAY.map((color) => (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => field.onChange(color)}
                                                            className={cn(
                                                                TEMPLATE_COLORS_MAP[color]?.default,
                                                                "w-8 h-8 rounded-full transition-all",
                                                                field.value === color && 'border-2 border-gray-900 scale-120'
                                                            )}
                                                            title={color}
                                                        />
                                                    ))}
                                                </div>
                                            </FormItem>
                                        )} />
                                    </div>


                                    {/* Discount Rules Section */}
                                    <div className="space-y-4 mt-8">
                                        <ClassDiscountRulesForm
                                            discountRules={discountRules}
                                            onChange={setDiscountRules}
                                            currency="EUR"
                                            price={parseInt(formData.price)}
                                        />
                                    </div>

                                </div>
                            </Form>
                        </ScrollArea>
                    </div>

                    <DrawerFooter className="flex-col gap-2 pt-4 border-t flex-shrink-0">
                        {hasSimilarInstances && !isLoadingSimilar && (
                            <div className="flex items-center space-x-2 px-1 mb-2">
                                <Switch
                                    id="apply-to-all-edit"
                                    checked={applyToAll}
                                    onCheckedChange={setApplyToAll}
                                    disabled={isSubmitting}
                                />
                                <Label htmlFor="apply-to-all-edit" className="text-sm font-medium">
                                    Apply to all future events
                                </Label>
                            </div>
                        )}

                        <Button
                            onClick={form.handleSubmit(handleUpdateClick)}
                            disabled={isSubmitting}
                            className="w-full"
                            variant="default"
                        >
                            {isSubmitting ? 'Updating...' : buttonText}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            <ConfirmUpdateInstancesDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                onConfirm={handleConfirmMultipleUpdate}
                onCancel={() => setPendingFormData(null)}
                isSubmitting={isSubmittingMultiple}
                similarInstances={similarInstances || []}
                businessTimezone={businessTimezone}
            />
        </>
    );
} 