import { useCurrentUser } from '@/components/stores/auth';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { Checkbox } from '@/components/ui/checkbox';
import { useVenues } from '@/features/venues/hooks/use-venues';
import { SpinningCircles } from '@/components/spinning-circles';
import { getCityOptions, getCityLabel, normalizeCityInput } from '@repo/utils/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const amenitiesSchema = z.object({
    showers: z.boolean().default(false),
    accessible: z.boolean().default(false),
    mats: z.boolean().default(false),
}).partial();

const servicesSchema = z.object({
    yoga: z.boolean().default(false),
    pilates: z.boolean().default(false),
    gym: z.boolean().default(false),
    massage: z.boolean().default(false),
    dance: z.boolean().default(false),
    crossfit: z.boolean().default(false),
    spinning: z.boolean().default(false),
    boxing: z.boolean().default(false),
    martialArts: z.boolean().default(false),
    swimming: z.boolean().default(false),
    personalTraining: z.boolean().default(false),
    physiotherapy: z.boolean().default(false),
    nutrition: z.boolean().default(false),
    meditation: z.boolean().default(false),
    stretching: z.boolean().default(false),
    hiit: z.boolean().default(false),
    zumba: z.boolean().default(false),
    trx: z.boolean().default(false),
}).partial();

const socialSchema = z.object({
    instagram: z.string().url().optional().or(z.literal('')),
    facebook: z.string().url().optional().or(z.literal('')),
    youtube: z.string().url().optional().or(z.literal('')),
}).partial();

const CITY_OPTIONS = getCityOptions();

const businessFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().min(1, 'Email is required'),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
    phone: z.string().optional(),
    website: z.string().optional().refine((val) => {
        if (!val) return true;
        return val.startsWith('http://') || val.startsWith('https://');
    }, 'Website must start with http:// or https://'),
    address: z.object({
        street: z.string().min(1, 'Street address is required'),
        city: z.string().min(1, 'City is required'),
        area: z.string().max(100, 'Area must be less than 100 characters').optional(),
        zipCode: z.string().min(1, 'Zip code is required').regex(/^\d{5}$/, 'Zip code must be 5 digits'),
        country: z.string().min(1),
        state: z.string().optional(),
    }),
    amenities: amenitiesSchema.optional(),
    services: servicesSchema.optional(),
    social: socialSchema.optional(),
});

type BusinessFormValues = z.infer<typeof businessFormSchema>;

type ServiceKey = keyof z.infer<typeof servicesSchema>;
const SERVICE_OPTIONS: Array<{ key: ServiceKey; label: string }> = [
    { key: 'boxing', label: 'Boxing' },
    { key: 'crossfit', label: 'Crossfit' },
    { key: 'dance', label: 'Dance' },
    { key: 'gym', label: 'Gym / Fitness' },
    { key: 'hiit', label: 'HIIT' },
    { key: 'martialArts', label: 'Martial Arts' },
    { key: 'massage', label: 'Massage / Therapy' },
    { key: 'meditation', label: 'Meditation' },
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'personalTraining', label: 'Personal Training' },
    { key: 'pilates', label: 'Pilates' },
    { key: 'physiotherapy', label: 'Physiotherapy' },
    { key: 'spinning', label: 'Spinning' },
    { key: 'stretching', label: 'Stretching' },
    { key: 'swimming', label: 'Swimming' },
    { key: 'trx', label: 'TRX' },
    { key: 'yoga', label: 'Yoga' },
    { key: 'zumba', label: 'Zumba' },
];

export function BusinessDetailsTab() {
    const { business } = useCurrentUser();
    const { venues, loading } = useVenues();
    const updateVenue = useMutation(api.mutations.venues.updateVenue);

    const venue = venues?.[0];

    const defaultValues = useMemo<BusinessFormValues>(() => ({
        name: venue?.name ?? business.name ?? '',
        email: venue?.email ?? business.email ?? '',
        description: venue?.description ?? '',
        phone: venue?.phone ?? business.phone ?? '',
        website: venue?.website ?? business.website ?? '',
        address: {
            street: venue?.address?.street ?? '',
            city: venue?.citySlug ?? normalizeCityInput(venue?.address?.city ?? '') ?? '',
            area: venue?.address?.area ?? '',
            zipCode: venue?.address?.zipCode ?? '',
            country: venue?.address?.country ?? 'Greece',
            state: venue?.address?.state ?? undefined,
        },
        amenities: {
            showers: venue?.amenities?.showers ?? false,
            accessible: venue?.amenities?.accessible ?? false,
            mats: venue?.amenities?.mats ?? false,
        },
        services: {
            yoga: venue?.services?.yoga ?? false,
            pilates: venue?.services?.pilates ?? false,
            gym: venue?.services?.gym ?? false,
            massage: venue?.services?.massage ?? false,
            dance: venue?.services?.dance ?? false,
            crossfit: venue?.services?.crossfit ?? false,
            spinning: venue?.services?.spinning ?? false,
            boxing: venue?.services?.boxing ?? false,
            martialArts: venue?.services?.martialArts ?? false,
            swimming: venue?.services?.swimming ?? false,
            personalTraining: venue?.services?.personalTraining ?? false,
            physiotherapy: venue?.services?.physiotherapy ?? false,
            nutrition: venue?.services?.nutrition ?? false,
            meditation: venue?.services?.meditation ?? false,
            stretching: venue?.services?.stretching ?? false,
            hiit: venue?.services?.hiit ?? false,
            zumba: venue?.services?.zumba ?? false,
            trx: venue?.services?.trx ?? false,
        },
        social: {
            instagram: venue?.socialMedia?.instagram ?? business.socialMedia?.instagram ?? '',
            facebook: venue?.socialMedia?.facebook ?? business.socialMedia?.facebook ?? '',
            youtube: venue?.socialMedia?.youtube ?? business.socialMedia?.youtube ?? '',
        },
    }), [venue, business]);

    const form = useForm<BusinessFormValues>({
        resolver: zodResolver(businessFormSchema),
        defaultValues,
    });

    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);

    const [isSaving, setIsSaving] = useState(false);

    const onSubmit = async (values: BusinessFormValues) => {
        if (!venue) return;
        setIsSaving(true);
        try {
            const selectedCity = CITY_OPTIONS.find(option => option.value === values.address.city);
            const citySlug = selectedCity?.value ?? values.address.city;
            const areaValue = values.address.area?.trim() || undefined;

            await updateVenue({
                venueId: venue._id,
                venue: {
                    name: values.name,
                    email: values.email,
                    description: values.description,
                    phone: values.phone,
                    website: values.website,
                    amenities: values.amenities,
                    services: values.services,
                    socialMedia: {
                        facebook: values.social?.facebook,
                        instagram: values.social?.instagram,
                        youtube: values.social?.youtube,
                    },
                    address: {
                        street: values.address.street,
                        city: citySlug,
                        ...(areaValue ? { area: areaValue } : {}),
                        zipCode: values.address.zipCode,
                        country: values.address.country,
                        ...(values.address.state ? { state: values.address.state } : {}),
                    },
                }
            });
            toast.success('Business settings saved successfully');
        } catch (e) {
            toast.error('Failed to save business settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <SpinningCircles />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {!venue && (
                    <div className="p-4 text-sm text-muted-foreground bg-muted rounded-md">
                        No venue found for your business.
                    </div>
                )}

                {/* Basic Information Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Business Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter your business name"
                                        disabled={isSaving || !venue}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="business@example.com"
                                        disabled={isSaving || !venue}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={3}
                                        placeholder="Tell us about your business..."
                                        disabled={isSaving || !venue}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="tel"
                                            placeholder="+30 123 456 7890"
                                            disabled={isSaving || !venue}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Website</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://example.com"
                                            disabled={isSaving || !venue}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Address</h3>

                    <FormField
                        control={form.control}
                        name="address.street"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Street Address <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="123 Main Street"
                                        disabled={isSaving || !venue}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="address.city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isSaving || !venue}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a city" />
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
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address.zipCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zip Code <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="12345"
                                            disabled={isSaving || !venue}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address.country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Country</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Greece"
                                            disabled={isSaving || !venue}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="address.area"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Area / Neighborhood (optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Kallithea, Nea Smyrni..."
                                        disabled={isSaving || !venue}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Amenities Section */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Available Amenities</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="amenities.showers"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isSaving || !venue}
                                        />
                                    </FormControl>
                                    <FormLabel>Showers</FormLabel>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amenities.accessible"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isSaving || !venue}
                                        />
                                    </FormControl>
                                    <FormLabel>Accessible</FormLabel>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amenities.mats"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isSaving || !venue}
                                        />
                                    </FormControl>
                                    <FormLabel>Mats Provided</FormLabel>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Services Section */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Services Offered</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {SERVICE_OPTIONS.map((opt) => (
                            <FormField
                                key={opt.key}
                                control={form.control}
                                name={`services.${opt.key}`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isSaving || !venue}
                                            />
                                        </FormControl>
                                        <FormLabel>{opt.label}</FormLabel>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Social Media Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Social Media</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="social.instagram"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Instagram</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://instagram.com/yourvenue"
                                            disabled={isSaving || !venue}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="social.facebook"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Facebook</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://facebook.com/yourvenue"
                                            disabled={isSaving || !venue}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="social.youtube"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>YouTube</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://youtube.com/yourvenue"
                                            disabled={isSaving || !venue}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Business Settings'}
                </Button>
            </form>
        </Form>
    );
}