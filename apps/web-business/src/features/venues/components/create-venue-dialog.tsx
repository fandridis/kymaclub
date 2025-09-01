import { api } from '@repo/api/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ConvexError } from 'convex/values';
import type { Doc } from '@repo/api/convex/_generated/dataModel';
import { Plus, MapPin, Mail, Phone, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getVenueCategoryOptions, type VenueCategory } from '@repo/utils/constants';

const createVenueSchema = z.object({
    name: z.string().min(1, "Venue name is required").max(100),
    email: z.string().min(1, "Email is required"),
    description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
    phone: z.string().optional(),
    website: z.string().optional().refine((val) => {
        if (!val) return true;
        return val.startsWith('http://') || val.startsWith('https://');
    }, "Website must start with http:// or https://"),

    // Primary business category
    primaryCategory: z.string().min(1, "Please select a business category") as z.ZodType<VenueCategory>,

    // Amenities
    amenitiesShowers: z.boolean().optional(),
    amenitiesAccessible: z.boolean().optional(),
    amenitiesMats: z.boolean().optional(),

    // Services
    serviceYoga: z.boolean().default(false),
    servicePilates: z.boolean().default(false),
    serviceGym: z.boolean().default(false),
    serviceMassage: z.boolean().default(false),
    serviceDance: z.boolean().default(false),
    serviceCrossfit: z.boolean().default(false),
    serviceSpinning: z.boolean().default(false),
    serviceBoxing: z.boolean().default(false),
    serviceMartialArts: z.boolean().default(false),
    serviceSwimming: z.boolean().default(false),
    servicePersonalTraining: z.boolean().default(false),
    servicePhysiotherapy: z.boolean().default(false),
    serviceNutrition: z.boolean().default(false),
    serviceMeditation: z.boolean().default(false),
    serviceStretching: z.boolean().default(false),
    serviceHiit: z.boolean().default(false),
    serviceZumba: z.boolean().default(false),
    serviceTrx: z.boolean().default(false),

    // Address fields
    addressStreet: z.string().min(1, "Street is required"),
    addressCity: z.string().min(1, "City is required"),
    addressZipCode: z.string().min(1, "Zip code is required").regex(/^\d{5}$/, "Zip code must be 5 digits"),
});

// Adjust types to align with @hookform/resolvers v3 (input vs output)
type VenueFormInput = z.input<typeof createVenueSchema>;
type VenueFormOutput = z.output<typeof createVenueSchema>;

type ServiceKey = 'yoga' | 'pilates' | 'gym' | 'massage' | 'dance' | 'crossfit' | 'spinning' | 'boxing' | 'martialArts' | 'swimming' | 'personalTraining' | 'physiotherapy' | 'nutrition' | 'meditation' | 'stretching' | 'hiit' | 'zumba' | 'trx';

const SERVICE_OPTIONS: Array<{ key: ServiceKey; label: string }> = [
    { key: 'yoga', label: 'Yoga' },
    { key: 'pilates', label: 'Pilates' },
    { key: 'gym', label: 'Gym / Fitness' },
    { key: 'massage', label: 'Massage / Therapy' },
    { key: 'dance', label: 'Dance' },
    { key: 'crossfit', label: 'Crossfit' },
    { key: 'spinning', label: 'Spinning' },
    { key: 'boxing', label: 'Boxing' },
    { key: 'martialArts', label: 'Martial Arts' },
    { key: 'swimming', label: 'Swimming' },
    { key: 'personalTraining', label: 'Personal Training' },
    { key: 'physiotherapy', label: 'Physiotherapy' },
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'meditation', label: 'Meditation' },
    { key: 'stretching', label: 'Stretching' },
    { key: 'hiit', label: 'HIIT' },
    { key: 'zumba', label: 'Zumba' },
    { key: 'trx', label: 'TRX' },
];

interface CreateVenueDialogProps {
    venue?: Doc<"venues">;
    isOpen?: boolean;
    hideTrigger?: boolean;
    onClose?: () => void;
}

export function CreateVenueDialog({ venue, isOpen, hideTrigger, onClose }: CreateVenueDialogProps) {
    const createVenue = useMutation(api.mutations.venues.createVenue);
    const updateVenue = useMutation(api.mutations.venues.updateVenue);
    const [isDrawerOpen, setIsDrawerOpen] = useState(isOpen ?? false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = !!venue;

    const form = useForm<VenueFormInput, any, VenueFormOutput>({
        resolver: zodResolver(createVenueSchema),
        defaultValues: {
            name: '',
            email: '',
            description: '',
            phone: '',
            website: '',
            primaryCategory: '' as VenueCategory,
            amenitiesShowers: false,
            amenitiesAccessible: false,
            amenitiesMats: false,
            serviceYoga: false,
            servicePilates: false,
            serviceGym: false,
            serviceMassage: false,
            serviceDance: false,
            serviceCrossfit: false,
            serviceSpinning: false,
            serviceBoxing: false,
            serviceMartialArts: false,
            serviceSwimming: false,
            servicePersonalTraining: false,
            servicePhysiotherapy: false,
            serviceNutrition: false,
            serviceMeditation: false,
            serviceStretching: false,
            serviceHiit: false,
            serviceZumba: false,
            serviceTrx: false,
            addressStreet: '',
            addressCity: '',
            addressZipCode: '',
        },
    });

    useEffect(() => {
        if (isEditMode && venue) {
            form.reset({
                name: venue.name,
                email: venue.email || '',
                description: venue.description || '',
                phone: venue.phone || '',
                website: venue.website || '',
                primaryCategory: venue.primaryCategory,
                amenitiesShowers: venue.amenities?.showers || false,
                amenitiesAccessible: venue.amenities?.accessible || false,
                amenitiesMats: venue.amenities?.mats || false,
                // Services
                serviceYoga: venue.services?.yoga || false,
                servicePilates: venue.services?.pilates || false,
                serviceGym: venue.services?.gym || false,
                serviceMassage: venue.services?.massage || false,
                serviceDance: venue.services?.dance || false,
                serviceCrossfit: venue.services?.crossfit || false,
                serviceSpinning: venue.services?.spinning || false,
                serviceBoxing: venue.services?.boxing || false,
                serviceMartialArts: venue.services?.martialArts || false,
                serviceSwimming: venue.services?.swimming || false,
                servicePersonalTraining: venue.services?.personalTraining || false,
                servicePhysiotherapy: venue.services?.physiotherapy || false,
                serviceNutrition: venue.services?.nutrition || false,
                serviceMeditation: venue.services?.meditation || false,
                serviceStretching: venue.services?.stretching || false,
                serviceHiit: venue.services?.hiit || false,
                serviceZumba: venue.services?.zumba || false,
                serviceTrx: venue.services?.trx || false,
                addressStreet: venue.address.street || '',
                addressCity: venue.address.city || '',
                addressZipCode: venue.address.zipCode || '',
            });
        }
    }, [isEditMode, venue, form]);

    // Sync external isOpen prop with internal state
    useEffect(() => {
        if (isOpen !== undefined) {
            setIsDrawerOpen(isOpen);
        }
    }, [isOpen]);

    const resetForm = () => {
        form.reset();
        setIsSubmitting(false);
    };

    // Reset form when drawer closes
    useEffect(() => {
        if (!isDrawerOpen && !isEditMode) {
            resetForm();
        }
    }, [isDrawerOpen, isEditMode]);

    const handleSubmit = async (data: VenueFormOutput) => {
        setIsSubmitting(true);

        try {
            const services = {
                yoga: data.serviceYoga,
                pilates: data.servicePilates,
                gym: data.serviceGym,
                massage: data.serviceMassage,
                dance: data.serviceDance,
                crossfit: data.serviceCrossfit,
                spinning: data.serviceSpinning,
                boxing: data.serviceBoxing,
                martialArts: data.serviceMartialArts,
                swimming: data.serviceSwimming,
                personalTraining: data.servicePersonalTraining,
                physiotherapy: data.servicePhysiotherapy,
                nutrition: data.serviceNutrition,
                meditation: data.serviceMeditation,
                stretching: data.serviceStretching,
                hiit: data.serviceHiit,
                zumba: data.serviceZumba,
                trx: data.serviceTrx,
            };

            const venueData = {
                name: data.name.trim(),
                email: data.email.trim(),
                description: data.description?.trim(),
                phone: data.phone?.trim(),
                website: data.website?.trim(),
                primaryCategory: data.primaryCategory,
                amenities: {
                    showers: data.amenitiesShowers || false,
                    accessible: data.amenitiesAccessible || false,
                    mats: data.amenitiesMats || false,
                },
                services,
                address: {
                    street: data.addressStreet.trim(),
                    city: data.addressCity.trim(),
                    zipCode: data.addressZipCode.trim(),
                    country: 'Greece', // Default country
                },
            };

            if (isEditMode) {
                await updateVenue({
                    venueId: venue!._id,
                    venue: {
                        ...venueData
                    }
                });
                toast.success("Venue updated successfully");
            } else {
                await createVenue({ venue: venueData });
                toast.success("Venue created successfully");
            }

            setIsDrawerOpen(false);
            onClose?.();
        } catch (error) {
            if (error instanceof ConvexError) {
                toast.error(error.data.message);
            } else {
                console.error(`Error ${isEditMode ? 'updating' : 'creating'} venue:`, error);
                toast.error(`Failed to ${isEditMode ? 'update' : 'create'} venue.`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {!hideTrigger && (
                <Button onClick={() => setIsDrawerOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Venue
                </Button>
            )}

            <Drawer direction='right' open={isDrawerOpen ?? isOpen} onOpenChange={(open) => {
                if (!open) {
                    onClose?.();
                }
                setIsDrawerOpen(open);
            }}>
                <DrawerContent className="w-full px-2 sm:max-w-lg overflow-y-auto">
                    <DrawerHeader className="pb-4">
                        <DrawerTitle className="text-left">
                            {isEditMode ? 'Edit Venue' : 'Add Venue'}
                        </DrawerTitle>
                        <DrawerDescription>
                            {isEditMode ? `Editing "${venue!.name}" venue` : 'Add a new venue where your classes will be held.'}
                        </DrawerDescription>
                    </DrawerHeader>

                    <Form {...form}>
                        <div className="space-y-6 pb-6">
                            <div className="space-y-4">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                Location Name <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input autoFocus placeholder="e.g., Main Studio" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Email <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="venue@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Describe this venue..." rows={3} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="primaryCategory" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Business Category <span className="text-red-500">*</span></FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value as string}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select business category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {getVenueCategoryOptions().map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="grid grid-cols-1 gap-4">
                                    <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                Phone
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="+30 123 456 7890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="website" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                Website
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="url" placeholder="https://example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                            </div>

                            {/* Address Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Address</h3>

                                <FormField control={form.control} name="addressStreet" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Street Address <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Main Street" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="addressCity" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Athens" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="addressZipCode" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Zip Code <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="12345" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                            </div>

                            {/* Services */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Services Offered</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {SERVICE_OPTIONS.map((option) => (
                                        <FormField
                                            key={option.key}
                                            control={form.control}
                                            name={`service${option.key.charAt(0).toUpperCase() + option.key.slice(1)}` as keyof VenueFormInput}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value as boolean}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel>{option.label}</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Amenities */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Amenities</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="amenitiesShowers" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <FormLabel>Showers</FormLabel>
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="amenitiesAccessible" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <FormLabel>Accessible</FormLabel>
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="amenitiesMats" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <FormLabel>Mats Provided</FormLabel>
                                        </FormItem>
                                    )} />
                                </div>
                            </div>
                        </div>
                    </Form>

                    <DrawerFooter className="flex-col gap-2 pt-4 border-t">
                        <Button
                            onClick={form.handleSubmit(handleSubmit)}
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update venue' : 'Create venue')}
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsDrawerOpen(false);
                                onClose?.();
                            }}
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}