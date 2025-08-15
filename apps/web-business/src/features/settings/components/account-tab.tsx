import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/components/stores/auth';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { toast } from 'sonner';
import { useState } from 'react';

const businessSchema = z.object({
    name: z.string().min(1, 'Business name is required'),
    phone: z.string().optional(),
});

type BusinessForm = z.infer<typeof businessSchema>;

const profileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function AccountTab() {
    const { user, business } = useCurrentUser();

    const [savingBusiness, setSavingBusiness] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const formBusiness = useForm<BusinessForm>({
        resolver: zodResolver(businessSchema),
        defaultValues: {
            name: business.name ?? '',
            phone: business.phone ?? '',
        },
    });

    const formProfile = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name ?? '',
        },
    });

    const updateBusinessDetails = useMutation(api.mutations.core.updateBusinessDetails);
    const updateCurrentUserProfile = useMutation(api.mutations.core.updateCurrentUserProfile);

    const onSubmitBusiness = async (values: BusinessForm) => {
        setSavingBusiness(true);
        try {
            await updateBusinessDetails({ name: values.name.trim(), phone: values.phone?.trim() || undefined });
            toast.success('Business details updated');
        } catch (e) {
            console.error(e);
            toast.error('Failed to update business details');
        } finally {
            setSavingBusiness(false);
        }
    };

    const onSubmitProfile = async (values: ProfileForm) => {
        setSavingProfile(true);
        try {
            await updateCurrentUserProfile({ name: values.name.trim() });
            toast.success('Profile updated');
        } catch (e) {
            console.error(e);
            toast.error('Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold">Account</h3>
                <p className="text-sm text-muted-foreground">Manage your business and personal profile.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Company Details</CardTitle>
                    <CardDescription>
                        Here you change your company information. This information is not customer-facing. You don't need to change it unless your actual company name, contact details or address are different from the ones you used during onboarding.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...formBusiness}>
                        <form onSubmit={formBusiness.handleSubmit(onSubmitBusiness)} className="space-y-4">
                            <FormField
                                control={formBusiness.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Business name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Your company name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={formBusiness.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone number</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. +30 69XXXXXXXX" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2">
                                <Button type="submit" disabled={savingBusiness}>
                                    {savingBusiness ? 'Saving…' : 'Save changes'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Profile</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...formProfile}>
                        <form onSubmit={formProfile.handleSubmit(onSubmitProfile)} className="space-y-4">
                            <FormField
                                control={formProfile.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Your name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2">
                                <Button type="submit" disabled={savingProfile}>
                                    {savingProfile ? 'Saving…' : 'Save changes'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
} 