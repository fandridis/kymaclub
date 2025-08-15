// routes/onboarding.tsx - Updated with react-hook-form and zod validation
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { ConvexError } from 'convex/values';
import { getAuthState, useAuthStore } from '@/components/stores/auth';
import { useRedirectGuard } from '@/hooks/use-redirect-guard';
import { getVenueCategoryOptions, type VenueCategory } from '@repo/utils/constants';

export const Route = createFileRoute('/onboarding')({
    component: Onboarding,
    beforeLoad: () => {
        const { user } = getAuthState();

        if (user === null) {
            throw redirect({
                to: '/sign-in',
                replace: true,
                search: {
                    redirect: '/settings'
                }
            })
        }

        if (user?.hasBusinessOnboarded) {
            throw redirect({
                to: '/dashboard',
                replace: true,
            })
        }
    }
});

const onboardingSchema = z.object({
    // Business details
    businessName: z.string().min(1, "Business name is required").max(100),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    phone: z.string().optional(),
    description: z.string().max(2000, "Description must be less than 2000 characters").optional(),

    // Location details (same as business address)
    address: z.object({
        street: z.string().min(1, "Street address is required"),
        city: z.string().min(1, "City is required"),
        zipCode: z.string().min(1, "Zip code is required").regex(/^\d{5}$/, "Zip code must be 5 digits"),
    }),

    // Primary business category
    primaryCategory: z.string().min(1, "Please select a business category") as z.ZodType<VenueCategory>,

    // Amenities
    amenitiesShowers: z.boolean().default(false),
    amenitiesAccessible: z.boolean().default(false),
    amenitiesMats: z.boolean().default(false),

    // Service categories
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
});

type FormData = z.infer<typeof onboardingSchema>;

function Onboarding() {
    const { signOut } = useAuthActions();
    const { logout } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useRedirectGuard(({ user }) => {
        if (user?.hasBusinessOnboarded) {
            return '/dashboard';
        }
        if (user === null) {
            return '/sign-in';
        }
        return null;
    })

    const createBusinessWithVenue = useMutation(api.mutations.core.createBusinessWithVenue);

    const form = useForm({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            businessName: '',
            email: '',
            phone: '',
            description: '',
            address: {
                street: '',
                city: '',
                zipCode: '',
            },
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
        },
    });

    const handleSubmit = async (data: FormData) => {
        setIsSubmitting(true);

        try {
            // Prepare venue services from selected checkboxes
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
            } as const;

            await createBusinessWithVenue({
                business: {
                    name: data.businessName.trim(),
                    email: data.email.trim(),
                    phone: data.phone?.trim() || undefined,
                    description: data.description?.trim() || undefined,
                    //  timezone: 'Europe/Athens', // Default for Greek businesses
                    // currency: 'EUR',
                    address: {
                        street: data.address.street.trim(),
                        city: data.address.city,
                        zipCode: data.address.zipCode.trim(),
                        state: 'Greece', // Default for Athens/Heraklion
                        country: 'Greece'
                    },
                },
                venue: {
                    name: data.businessName.trim(),
                    email: data.email.trim(),
                    description: data.description?.trim() || undefined,
                    primaryCategory: data.primaryCategory,
                    address: {
                        street: data.address.street.trim(),
                        city: data.address.city,
                        zipCode: data.address.zipCode.trim(),
                        state: 'Greece', // Default for Athens/Heraklion
                        country: 'Greece'
                    },
                    amenities: {
                        showers: data.amenitiesShowers,
                        accessible: data.amenitiesAccessible,
                        mats: data.amenitiesMats,
                    },
                    phone: data.phone?.trim() || undefined,
                    services,
                },
            });
            toast.success('Business setup completed successfully!');
            // Navigation will happen automatically via AuthSync when user state updates
        } catch (error) {
            if (error instanceof ConvexError) {
                console.error('Convex error:', error.data);
                toast.error(error.data.message || 'Failed to setup business');
            } else {
                console.error('Failed to setup business:', error);
                toast.error('Failed to setup business. Please try again.');
            }
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-2">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to Kyma club!</CardTitle>
                    <CardDescription>
                        Let's set up your business and location to start accepting bookings.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                            {/* Business Information Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Basic information</h3>

                                {/* Business name - full width */}
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Name <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter your business name"
                                                    disabled={isSubmitting}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Description - full width */}
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Tell us about your business. This will be displayed on your business and class pages."
                                                    disabled={isSubmitting}
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Primary Category */}
                                <FormField
                                    control={form.control}
                                    name="primaryCategory"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Category <span className="text-red-500">*</span></FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value as VenueCategory}
                                                disabled={isSubmitting}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select your business category" />
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
                                    )}
                                />

                                {/* Email, Phone, Website */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                        disabled={isSubmitting}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone (optional)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="tel"
                                                        placeholder="+30 123 456 7890"
                                                        disabled={isSubmitting}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Address */}
                                <FormField
                                    control={form.control}
                                    name="address.street"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Street Address <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="123 Main Street"
                                                    disabled={isSubmitting}
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
                                        name="address.city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={isSubmitting}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select a city" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Athens">Athens</SelectItem>
                                                        <SelectItem value="Heraklion">Heraklion</SelectItem>
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
                                                        disabled={isSubmitting}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Amenities */}
                            <div className="space-y-3">
                                <FormLabel>Available Amenities</FormLabel>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="amenitiesShowers"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled={isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormLabel>Showers</FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="amenitiesAccessible"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled={isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormLabel>Accessible</FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="amenitiesMats"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled={isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormLabel>Mats Provided</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>


                            {/* Location Details Section */}
                            <div className="space-y-4">
                                {/* Services */}
                                <div className="space-y-3">
                                    <FormLabel>What services do you offer?</FormLabel>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="serviceYoga"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isSubmitting}
                                                        />
                                                    </FormControl>
                                                    <FormLabel>Yoga</FormLabel>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="servicePilates"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isSubmitting}
                                                        />
                                                    </FormControl>
                                                    <FormLabel>Pilates</FormLabel>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="serviceGym"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isSubmitting}
                                                        />
                                                    </FormControl>
                                                    <FormLabel>Gym / Fitness</FormLabel>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="serviceMassage"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isSubmitting}
                                                        />
                                                    </FormControl>
                                                    <FormLabel>Massage / Therapy</FormLabel>
                                                </FormItem>
                                            )}
                                        />

                                        {/* Added services */}
                                        <FormField control={form.control} name="serviceDance" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Dance</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceCrossfit" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Crossfit</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceSpinning" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Spinning</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceBoxing" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Boxing</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceMartialArts" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Martial Arts</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceSwimming" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Swimming</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="servicePersonalTraining" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Personal Training</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="servicePhysiotherapy" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Physiotherapy</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceNutrition" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Nutrition</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceMeditation" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Meditation</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceStretching" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Stretching</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceHiit" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>HIIT</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceZumba" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>Zumba</FormLabel>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="serviceTrx" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormLabel>TRX</FormLabel>
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                // First clear local state immediately
                                logout();

                                // Then sign out from Convex - AuthSync + root component useEffect will handle redirect
                                signOut();
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                        >
                            Not you? Sign out
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}