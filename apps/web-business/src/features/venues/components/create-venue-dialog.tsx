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
import { useTypedTranslation } from '@/lib/typed';
import { useIsMobile } from '@/hooks/use-mobile';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getVenueCategoryOptions, getCityOptions, normalizeCityInput, type VenueCategory } from '@repo/utils/constants';

const CITY_OPTIONS = getCityOptions();

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
    addressArea: z.string().max(100, "Area must be less than 100 characters").optional(),
    addressZipCode: z.string().min(1, "Zip code is required").regex(/^\d{5}$/, "Zip code must be 5 digits"),
});

// Adjust types to align with @hookform/resolvers v3 (input vs output)
type VenueFormInput = z.input<typeof createVenueSchema>;
type VenueFormOutput = z.output<typeof createVenueSchema>;

type ServiceKey = 'yoga' | 'pilates' | 'gym' | 'massage' | 'dance' | 'crossfit' | 'spinning' | 'boxing' | 'martialArts' | 'swimming' | 'personalTraining' | 'physiotherapy' | 'nutrition' | 'meditation' | 'stretching' | 'hiit' | 'zumba' | 'trx';

const SERVICE_OPTIONS: Array<{ key: ServiceKey; translationKey: string }> = [
    { key: 'yoga', translationKey: 'routes.onboarding.yoga' },
    { key: 'pilates', translationKey: 'routes.onboarding.pilates' },
    { key: 'gym', translationKey: 'routes.onboarding.gym' },
    { key: 'massage', translationKey: 'routes.onboarding.massage' },
    { key: 'dance', translationKey: 'routes.onboarding.dance' },
    { key: 'crossfit', translationKey: 'routes.onboarding.crossfit' },
    { key: 'spinning', translationKey: 'routes.onboarding.spinning' },
    { key: 'boxing', translationKey: 'routes.onboarding.boxing' },
    { key: 'martialArts', translationKey: 'routes.onboarding.martialArts' },
    { key: 'swimming', translationKey: 'routes.onboarding.swimming' },
    { key: 'personalTraining', translationKey: 'routes.onboarding.personalTraining' },
    { key: 'physiotherapy', translationKey: 'routes.onboarding.physiotherapy' },
    { key: 'nutrition', translationKey: 'routes.onboarding.nutrition' },
    { key: 'meditation', translationKey: 'routes.onboarding.meditation' },
    { key: 'stretching', translationKey: 'routes.onboarding.stretching' },
    { key: 'hiit', translationKey: 'routes.onboarding.hiit' },
    { key: 'zumba', translationKey: 'routes.onboarding.zumba' },
    { key: 'trx', translationKey: 'routes.onboarding.trx' },
];

interface CreateVenueDialogProps {
    venue?: Doc<"venues">;
    isOpen?: boolean;
    hideTrigger?: boolean;
    onClose?: () => void;
}

export function CreateVenueDialog({ venue, isOpen, hideTrigger, onClose }: CreateVenueDialogProps) {
    const { t } = useTypedTranslation();
    const isMobile = useIsMobile();
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
            addressArea: '',
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
                addressCity: venue.citySlug || normalizeCityInput(venue.address.city || '') || '',
                addressArea: venue.address.area || '',
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

            const selectedCity = CITY_OPTIONS.find(option => option.value === data.addressCity);
            const citySlug = selectedCity?.value ?? data.addressCity;
            const areaValue = data.addressArea?.trim() || undefined;

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
                    city: citySlug,
                    ...(areaValue ? { area: areaValue } : {}),
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
                toast.success(t('routes.settings.venueDialog.venueUpdatedSuccess'));
            } else {
                await createVenue({ venue: venueData });
                toast.success(t('routes.settings.venueDialog.venueCreatedSuccess'));
            }

            setIsDrawerOpen(false);
            onClose?.();
        } catch (error) {
            if (error instanceof ConvexError) {
                toast.error(error.data.message);
            } else {
                console.error(`Error ${isEditMode ? 'updating' : 'creating'} venue:`, error);
                toast.error(isEditMode ? t('routes.settings.venueDialog.failedToUpdateVenue') : t('routes.settings.venueDialog.failedToCreateVenue'));
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
                    {t('routes.settings.venueDialog.addVenue')}
                </Button>
            )}

            <Drawer direction={isMobile ? 'bottom' : 'right'} open={isDrawerOpen ?? isOpen} onOpenChange={(open) => {
                if (!open) {
                    onClose?.();
                }
                setIsDrawerOpen(open);
            }}>
                <DrawerContent className={`flex flex-col h-screen ${!isMobile ? 'data-[vaul-drawer-direction=right]:sm:max-w-md' : ''}`}>
                    <DrawerHeader className="h-[64px] border-b">
                        <DrawerTitle className="text-xl">
                            {isEditMode ? t('routes.settings.venueDialog.editVenueTitle') : t('routes.settings.venueDialog.addVenueTitle')}
                        </DrawerTitle>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto">
                        <ScrollArea className="h-full p-4">
                            <Form {...form}>
                                <div className="space-y-6 pb-6">
                                    <div className="space-y-4">
                                        {/* Basic Information */}
                                        <div className="grid grid-cols-1 gap-4">
                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        {t('routes.settings.venueDialog.locationName')} <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input autoFocus placeholder={t('routes.settings.venueNamePlaceholder')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="email" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4" />
                                                        {t('common.email')} <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder={t('routes.settings.venueEmailPlaceholder')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={form.control} name="description" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('common.description')}</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder={t('routes.settings.venueDescriptionPlaceholder')} rows={3} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="primaryCategory" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('routes.settings.venueDialog.businessCategory')} <span className="text-red-500">*</span></FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value as string}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder={t('routes.settings.venueDialog.selectBusinessCategory')} />
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
                                                        {t('common.phone')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input type="tel" placeholder={t('routes.settings.venuePhonePlaceholder')} {...field} />
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
                                                        <Input type="url" placeholder={t('routes.settings.venueWebsitePlaceholder')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>

                                    {/* Address Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium">{t('common.address')}</h3>

                                        <FormField control={form.control} name="addressStreet" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('routes.settings.venueDialog.streetAddress')} <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t('routes.settings.addressPlaceholder')} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="addressCity" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('common.city')} <span className="text-red-500">*</span></FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder={t('routes.settings.cityPlaceholder')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {CITY_OPTIONS.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="addressZipCode" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('common.zipCode')} <span className="text-red-500">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t('routes.settings.zipCodePlaceholder')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={form.control} name="addressArea" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Area / Neighborhood (optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Kallithea, Nea Smyrni..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {/* Services */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium">{t('routes.settings.venueDialog.servicesOffered')}</h3>
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
                                                            <FormLabel>{t(option.translationKey as any)}</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Amenities */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium">{t('routes.settings.venueDialog.amenities')}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="amenitiesShowers" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel>{t('routes.settings.venueDialog.showers')}</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="amenitiesAccessible" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel>{t('routes.settings.venueDialog.accessible')}</FormLabel>
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="amenitiesMats" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel>{t('routes.settings.venueDialog.matsProvided')}</FormLabel>
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        </ScrollArea>
                    </div>

                    <DrawerFooter className="flex-col gap-2 pt-4 border-t flex-shrink-0">
                        <Button
                            onClick={form.handleSubmit(handleSubmit)}
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? (isEditMode ? t('routes.settings.venueDialog.updating') : t('routes.settings.venueDialog.creating')) : (isEditMode ? t('routes.settings.venueDialog.updateVenueButton') : t('routes.settings.venueDialog.createVenueButton'))}
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
                            {t('common.cancel')}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}