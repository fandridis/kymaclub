import React, { useState } from 'react';
import { Plus, Clock, Users, BookOpen, Tag, X, User, Palette, Shapes, Settings } from 'lucide-react';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EuroPriceInput } from "@/components/euro-price-input";
import { useEffect } from 'react';
import { getDurationOptions } from '@/features/calendar/utils/duration';
import { ConvexError } from 'convex/values';
import { useVenues } from '@/features/venues/hooks/use-venues';
import { TEMPLATE_COLORS, TEMPLATE_COLORS_ARRAY } from '@repo/utils/colors';
import { cn } from '@/lib/utils';
import { TEMPLATE_COLORS_MAP } from '@/utils/colors';
import { ClassDiscountRulesForm } from '@/components/class-discount-rules-form';
import { VENUE_CATEGORIES, VENUE_CATEGORY_DISPLAY_NAMES, type VenueCategory } from '@repo/utils/constants';



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

const createTemplateSchema = z.object({
    // Class Details
    name: z.string().min(1, "Class name is required"),
    instructor: z.string().min(1, "Instructor name is required"),
    description: z.string().optional(),
    tags: z.array(z.string()),
    color: z.string().optional(),
    venueId: z.string().min(1, "Venue is required"),
    primaryCategory: z.string().min(1, "Category is required"),

    // Class Settings
    duration: z.string().min(1, "Duration is required"),

    // Booking Rules
    capacity: z.string().min(1, "Capacity is required").refine((val) => parseInt(val) > 0, "Capacity must be greater than 0"),
    price: z.string().min(1, "Price is required").refine((val) => {
        const priceInCents = parseInt(val);
        return priceInCents >= 100 && priceInCents <= 10000;
    }, "Price must be between €1.00 and €100.00"),
    allowWaitlist: z.boolean(),
    waitlistCapacity: z.string().optional(),

    // Booking Window Toggle
    enableBookingWindow: z.boolean(),
    bookingWindowMinHours: z.string().optional(),
    bookingWindowMaxHours: z.string().optional(),

    // Refund Policy Toggle
    enableRefundPolicy: z.boolean(),
    cancellationWindowHours: z.string().optional(),

    // Booking Control
    disableBookings: z.boolean().optional(),

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
})

type DiscountRule = z.infer<typeof discountRuleSchema>;

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
    const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
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
            color: TEMPLATE_COLORS.Green,
            duration: '60',
            capacity: "15",
            price: "1500", // 15 euros in cents
            allowWaitlist: false,
            waitlistCapacity: "5",
            enableBookingWindow: false,
            bookingWindowMinHours: "2",
            bookingWindowMaxHours: "168",
            enableRefundPolicy: false,
            cancellationWindowHours: "2",
            disableBookings: false,
            discountRules: [],
            primaryCategory: '' as VenueCategory,
        },
    });

    // Auto-select venue if only one exists and no venue is currently selected
    useEffect(() => {
        if (venues.length === 1 && !form.getValues("venueId") && !isEditMode) {
            const defaultVenue = venues[0]!;
            form.setValue("venueId", defaultVenue._id);
            form.setValue("primaryCategory", defaultVenue.primaryCategory as VenueCategory);
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
                color: classTemplate!.color || TEMPLATE_COLORS.Green,
                duration: classTemplate!.duration.toString(),
                capacity: classTemplate!.capacity.toString(),
                price: classTemplate!.price?.toString() || "1500", // Default to 15 euros in cents
                allowWaitlist: classTemplate!.allowWaitlist || false,
                waitlistCapacity: classTemplate!.waitlistCapacity?.toString() || "5",
                enableBookingWindow: !!(classTemplate!.bookingWindow?.minHours || classTemplate!.bookingWindow?.maxHours),
                bookingWindowMinHours: (classTemplate!.bookingWindow?.minHours || 2).toString(),
                bookingWindowMaxHours: (classTemplate!.bookingWindow?.maxHours || 168).toString(),
                enableRefundPolicy: !!(classTemplate!.cancellationWindowHours && classTemplate!.cancellationWindowHours > 0),
                cancellationWindowHours: classTemplate!.cancellationWindowHours?.toString() || "2",
                disableBookings: classTemplate!.disableBookings || false,
                discountRules: classTemplate!.discountRules || [],
                primaryCategory: (classTemplate!.primaryCategory as VenueCategory) || '' as VenueCategory,
            });
            // Also update the discount rules state
            setDiscountRules(classTemplate!.discountRules || []);
        }
    }, [isEditMode, classTemplate, form]);

    const resetForm = () => {
        form.reset();
        setCurrentTag("");
        setLoading(false);
        setDiscountRules([]);
        // Re-auto-select venue after reset if only one exists
        if (venues.length === 1 && !isEditMode) {
            form.setValue("venueId", venues[0]!._id);
            form.setValue("primaryCategory", venues[0]!.primaryCategory as VenueCategory);
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
                primaryCategory: data.primaryCategory as VenueCategory,
                description: data.description?.trim(),
                instructor: data.instructor.trim(),
                duration: parseInt(data.duration),
                capacity: parseInt(data.capacity),
                price: parseInt(data.price),
                allowWaitlist: data.allowWaitlist,
                waitlistCapacity: data.allowWaitlist && data.waitlistCapacity
                    ? parseInt(data.waitlistCapacity)
                    : undefined,
                bookingWindow: data.enableBookingWindow ? {
                    minHours: parseInt(data.bookingWindowMinHours || "0"),
                    maxHours: parseInt(data.bookingWindowMaxHours || "0")
                } : undefined,
                cancellationWindowHours: data.enableRefundPolicy && data.cancellationWindowHours
                    ? parseInt(data.cancellationWindowHours)
                    : 0,
                disableBookings: data.disableBookings || false,
                tags: data.tags.length > 0 ? data.tags : undefined,
                color: data.color,
                discountRules: discountRules.length > 0 ? discountRules.map(rule => ({
                    id: rule.id,
                    name: rule.name,
                    condition: rule.condition,
                    discount: rule.discount,
                })) : undefined,
            };

            if (isEditMode) {
                console.log("Updating class template", templateData);
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

    useEffect(() => {
        const selectedVenue = venues.find((venue) => venue._id === formData.venueId);
        if (selectedVenue && !formData.primaryCategory) {
            form.setValue('primaryCategory', selectedVenue.primaryCategory as VenueCategory);
        }
    }, [formData.venueId, formData.primaryCategory, venues, form]);


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
                <DrawerContent className="flex flex-col h-screen data-[vaul-drawer-direction=right]:sm:max-w-md">
                    <DrawerHeader className="h-[64px] border-b">
                        <DrawerTitle className="text-xl">
                            {isEditMode ? 'Edit Template' : 'Create Template'}
                        </DrawerTitle>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto">
                        <ScrollArea className="h-full p-4">
                            <Form {...form}>
                                <div className="space-y-6 pb-6">
                                    <div className="space-y-4">
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

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="primaryCategory" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <Shapes className="h-4 w-4" />
                                                        Class Category <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select category" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {VENUE_CATEGORIES.map((category) => (
                                                                    <SelectItem key={category} value={category}>
                                                                        {VENUE_CATEGORY_DISPLAY_NAMES[category]}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
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
                                                    <FormControl>
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

                                        <FormField control={form.control} name="disableBookings" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <FormLabel>Start with bookings disabled</FormLabel>
                                            </FormItem>
                                        )} />

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
                                </div>
                            </Form>
                        </ScrollArea>
                    </div>

                    <DrawerFooter className="flex-col gap-2 pt-4 border-t flex-shrink-0">
                        <Button
                            onClick={form.handleSubmit(handleSubmit)}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Template' : 'Create this template')}
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
