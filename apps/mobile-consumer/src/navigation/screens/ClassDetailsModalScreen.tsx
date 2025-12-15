import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert, Platform, InteractionManager } from 'react-native';
import { Image } from 'expo-image';
import { Calendar1Icon, ClockIcon, CalendarOffIcon, ChevronLeftIcon, CheckCircleIcon, Trophy, EuroIcon } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Carousel from 'react-native-reanimated-carousel';
import { useQuery, useAction } from 'convex/react';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { el } from 'date-fns/locale/el';
import { tz } from '@date-fns/tz';
import type { RootStackParamList } from '..';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useVenueClassOfferings } from '../../hooks/use-venue-class-offerings';
import { Divider } from '../../components/Divider';
import { SameClassCard } from '../../components/SameClassCard';
import { theme } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCancellationInfo, getCancellationMessage, getCancellationTranslations } from '../../utils/cancellationUtils';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { useTypedTranslation } from '../../i18n/typed';
import i18n from '../../i18n';
import type { Question, QuestionAnswer } from '@repo/api/types/questionnaire';
import { getEffectiveQuestionnaire } from '@repo/api/operations/questionnaire';
import { useStripe } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { consumePendingQuestionnaireBooking } from '../../utils/pendingQuestionnaireBooking';

// Format cents to EUR display
function formatEuro(cents: number): string {
    return `€${(cents / 100).toFixed(2)}`;
}

type ClassDetailsRoute = RouteProp<RootStackParamList, 'ClassDetailsModal'>;

// Discount rule type based on schema
type ClassDiscountRule = {
    id: string;
    name: string;
    condition: {
        type: "hours_before_min" | "hours_before_max" | "always";
        hours?: number;
    };
    discount: {
        type: "fixed_amount";
        value: number;
    };
};

// Discount calculation result (prices in cents)
type DiscountCalculationResult = {
    originalPriceCents: number;
    finalPriceCents: number;
    appliedDiscount: {
        discountValueCents: number;
        savedCents: number;
        ruleName: string;
    } | null;
};

// Helper functions for discount calculation (duplicated from ClassCard)
function doesRuleApply(rule: ClassDiscountRule, hoursUntilClass: number): boolean {
    switch (rule.condition.type) {
        case "hours_before_min":
            return rule.condition.hours !== undefined && hoursUntilClass >= rule.condition.hours;
        case "hours_before_max":
            return rule.condition.hours !== undefined && hoursUntilClass <= rule.condition.hours && hoursUntilClass >= 0;
        case "always":
            return true;
        default:
            return false;
    }
}

function findBestDiscountRule(rules: ClassDiscountRule[], hoursUntilClass: number): { rule: ClassDiscountRule; ruleName: string } | null {
    let bestRule: ClassDiscountRule | null = null;
    let bestDiscount = 0;

    for (const rule of rules) {
        if (doesRuleApply(rule, hoursUntilClass) && rule.discount.value > bestDiscount) {
            bestRule = rule;
            bestDiscount = rule.discount.value;
        }
    }

    return bestRule ? { rule: bestRule, ruleName: bestRule.name } : null;
}

function formatTimeRemaining(
    hoursUntilClass: number,
    timeUnitDays: string,
    timeUnitHours: string,
    timeUnitMinutes: string
): string {
    const totalMinutes = Math.max(0, Math.round(hoursUntilClass * 60));
    const minutesInDay = 60 * 24;

    const days = Math.floor(totalMinutes / minutesInDay);
    const remainingMinutesAfterDays = totalMinutes % minutesInDay;
    const hours = Math.floor(remainingMinutesAfterDays / 60);
    const minutes = remainingMinutesAfterDays % 60;

    const parts: string[] = [];

    if (days > 0) {
        parts.push(`${days}${timeUnitDays}`);
    }

    if (hours > 0 || days > 0) {
        parts.push(`${hours}${timeUnitHours}`);
    }

    if (minutes > 0 || parts.length === 0) {
        parts.push(`${minutes}${timeUnitMinutes}`);
    }

    return parts.join(' ');
}

function getDiscountTimingText(
    discountResult: DiscountCalculationResult,
    classInstance: any,
    timeUnitDays: string,
    timeUnitHours: string,
    timeUnitMinutes: string,
    t: ReturnType<typeof useTypedTranslation>['t']
): string {
    if (!discountResult.appliedDiscount) return '';

    const now = Date.now();
    const hoursUntilClass = Math.max(0, (classInstance.startTime - now) / (1000 * 60 * 60));
    const ruleName = discountResult.appliedDiscount.ruleName;
    const formattedTime = formatTimeRemaining(hoursUntilClass, timeUnitDays, timeUnitHours, timeUnitMinutes);
    const savedAmount = formatEuro(discountResult.appliedDiscount.savedCents);

    if (ruleName.toLowerCase().includes('early')) {
        return t('classes.earlyBirdDiscount', { time: formattedTime }) + ` (${t('classes.save')} ${savedAmount})`;
    } else if (ruleName.toLowerCase().includes('last') || ruleName.toLowerCase().includes('minute')) {
        return t('classes.lastMinuteDiscount', { time: formattedTime }) + ` (${t('classes.save')} ${savedAmount})`;
    } else {
        return t('classes.discountActive', { time: formattedTime }) + ` (${t('classes.save')} ${savedAmount})`;
    }
}

function getBookingWindowText(
    classInstance: any,
    closesInTemplate: string,
    timeUnitDays: string,
    timeUnitHours: string,
    timeUnitMinutes: string
): string | null {
    if (!classInstance) return null;

    const bookingWindow = classInstance.bookingWindow ?? classInstance.templateSnapshot?.bookingWindow;
    if (!bookingWindow?.minHours) return null;

    const now = Date.now();
    const hoursUntilClass = Math.max(0, (classInstance.startTime - now) / (1000 * 60 * 60));

    if (hoursUntilClass <= bookingWindow.minHours) {
        return null; // Booking window has already closed
    }

    const hoursUntilBookingCloses = hoursUntilClass - bookingWindow.minHours;
    const formattedTime = formatTimeRemaining(hoursUntilBookingCloses, timeUnitDays, timeUnitHours, timeUnitMinutes);

    // Replace {{time}} placeholder with the formatted time
    return closesInTemplate.replace('{{time}}', formattedTime);
}

function calculateClassDiscount(classInstance: any, templateData: any): DiscountCalculationResult {
    const priceInCents = classInstance?.price ?? templateData?.price ?? 1000;

    if (!classInstance) {
        return {
            originalPriceCents: priceInCents,
            finalPriceCents: priceInCents,
            appliedDiscount: null,
        };
    }

    const now = Date.now();
    const hoursUntilClass = (classInstance.startTime - now) / (1000 * 60 * 60);

    const discountRules: ClassDiscountRule[] =
        classInstance.discountRules ||
        classInstance.templateSnapshot?.discountRules ||
        templateData?.discountRules ||
        [];

    if (discountRules.length === 0) {
        return {
            originalPriceCents: priceInCents,
            finalPriceCents: priceInCents,
            appliedDiscount: null,
        };
    }

    const bestRule = findBestDiscountRule(discountRules, hoursUntilClass);

    if (!bestRule) {
        return {
            originalPriceCents: priceInCents,
            finalPriceCents: priceInCents,
            appliedDiscount: null,
        };
    }

    const discountValueCents = bestRule.rule.discount.value;
    const finalPriceCents = Math.max(0, priceInCents - discountValueCents);
    const savedCents = priceInCents - finalPriceCents;

    return {
        originalPriceCents: priceInCents,
        finalPriceCents,
        appliedDiscount: {
            discountValueCents,
            savedCents,
            ruleName: bestRule.ruleName,
        },
    };
}

const { width: screenWidth } = Dimensions.get('window');

// Map i18next language codes to date-fns locales
const getDateFnsLocale = (language: string) => {
    switch (language) {
        case 'el':
            return el;
        case 'en':
        default:
            return enUS;
    }
};

export function ClassDetailsModalScreen() {
    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
    const navigation = useNavigation();
    const route = useRoute<ClassDetailsRoute>();
    const { t } = useTypedTranslation();
    const { classInstance, classInstanceId } = route.params;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { showActionSheetWithOptions } = useActionSheet();
    const { user } = useCurrentUser();
    const cancelBookingWithRefund = useAction(api.actions.payments.cancelBookingWithRefund);
    const createClassPaymentIntent = useAction(api.actions.payments.createClassPaymentIntent);
    const cancelClassPaymentIntent = useAction(api.actions.payments.cancelClassPaymentIntent);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [isBooking, setIsBooking] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isHeaderWhite, setIsHeaderWhite] = useState(false);
    const [headerOpacity, setHeaderOpacity] = useState(0);
    const { bottom: bottomInset } = useSafeAreaInsets();
    const [now, setNow] = useState(new Date());

    // Fetch classInstance if not provided directly
    const fetchedClassInstance = useQuery(
        api.queries.classInstances.getConsumerClassInstanceById,
        classInstance || !classInstanceId ? "skip" : { instanceId: classInstanceId }
    );

    // Use either the provided classInstance or the fetched one
    const finalClassInstance = classInstance || fetchedClassInstance;

    // ALWAYS call these hooks, even if finalClassInstance is null
    const existingBooking = useQuery(
        api.queries.bookings.getUserBookings,
        finalClassInstance && user ? { classInstanceId: finalClassInstance._id } : "skip"
    );

    const bookingHistory = useQuery(
        api.queries.bookings.getUserBookingHistory,
        finalClassInstance && user ? { classInstanceId: finalClassInstance._id } : "skip"
    );

    const venue = useQuery(
        api.queries.venues.getVenueById,
        finalClassInstance ? { venueId: finalClassInstance.venueId } : "skip"
    );

    // Fetch class offerings (unique class types) for this venue
    const { offerings: classOfferings, loading: offeringsLoading } = useVenueClassOfferings({
        venueId: finalClassInstance?.venueId,
    });

    // Fetch template to get questionnaire (use public query for consumer access)
    const template = useQuery(
        api.queries.classTemplates.getClassTemplateByIdPublic,
        finalClassInstance?.templateId ? { templateId: finalClassInstance.templateId } : "skip"
    );

    // Get effective questionnaire (instance overrides template)
    const effectiveQuestionnaire = useMemo(() => {
        return getEffectiveQuestionnaire(
            template?.questionnaire as Question[] | undefined,
            finalClassInstance?.questionnaire as Question[] | undefined
        ) || [];
    }, [template?.questionnaire, finalClassInstance?.questionnaire]);

    // Check for tournament widget
    const widget = useQuery(
        api.queries.widgets.getByInstance,
        finalClassInstance ? { classInstanceId: finalClassInstance._id } : "skip"
    );
    const hasTournament = widget && widget.status !== 'cancelled';

    // Fetch upcoming instances of the same class (same template)
    const sameClassInstances = useQuery(
        api.queries.classInstances.getUpcomingClassInstancesByTemplate,
        finalClassInstance?.templateId ? {
            templateId: finalClassInstance.templateId,
            excludeInstanceId: finalClassInstance._id,
            startDate: now.getTime(),
            limit: 10,
        } : "skip"
    );

    // Get image IDs with null-safe access
    const templateSnapshot = finalClassInstance?.templateSnapshot;
    const templateImageIds = templateSnapshot?.imageStorageIds ?? [];
    const venueImageIds = venue?.imageStorageIds ?? finalClassInstance?.venueSnapshot?.imageStorageIds ?? [];
    const allImageIds = [...templateImageIds, ...venueImageIds];

    const imageUrlsQuery = useQuery(
        api.queries.uploads.getUrls,
        allImageIds.length > 0 ? { storageIds: allImageIds } : "skip"
    );

    // Collect all image storage IDs from class offerings
    const offeringImageStorageIds = useMemo(() => {
        const ids: Id<"_storage">[] = [];
        classOfferings.forEach(offering => {
            if (offering.imageStorageIds?.length) {
                ids.push(offering.imageStorageIds[0]); // Only first image per offering
            }
        });
        return ids;
    }, [classOfferings]);

    // Fetch image URLs for class offerings
    const offeringImageUrlsQuery = useQuery(
        api.queries.uploads.getUrls,
        offeringImageStorageIds.length > 0 ? { storageIds: offeringImageStorageIds } : "skip"
    );

    // Create storage ID to URL mapping for offerings
    const offeringStorageIdToUrl = useMemo(() => {
        const map = new Map<string, string | null>();
        if (offeringImageUrlsQuery) {
            for (const { storageId, url } of offeringImageUrlsQuery) {
                map.set(storageId, url);
            }
        }
        return map;
    }, [offeringImageUrlsQuery]);

    // useMemo hooks - MUST be called unconditionally
    const storageIdToUrl = useMemo(() => {
        const map = new Map<string, string | null>();
        if (imageUrlsQuery) {
            for (const { storageId, url } of imageUrlsQuery) {
                map.set(storageId, url);
            }
        }
        return map;
    }, [imageUrlsQuery]);

    const imageUrls = useMemo(() => {
        const urls: string[] = [];
        templateImageIds.forEach(id => {
            const url = storageIdToUrl.get(id);
            if (url) urls.push(url);
        });
        venueImageIds.forEach(id => {
            const url = storageIdToUrl.get(id);
            if (url) urls.push(url);
        });
        return urls;
    }, [templateImageIds, venueImageIds, storageIdToUrl]);

    const discountResult = useMemo(
        () => calculateClassDiscount(finalClassInstance, templateSnapshot),
        [finalClassInstance, templateSnapshot]
    );

    // Memoize translated time units and booking window template
    const timeUnitDays = t('explore.timeUnitDays');
    const timeUnitHours = t('explore.timeUnitHours');
    const timeUnitMinutes = t('explore.timeUnitMinutes');
    const closesInTemplate = useMemo(() => {
        const templateMarker = '__TIME_PLACEHOLDER__';
        return t('explore.closesIn', { time: templateMarker }).replace(templateMarker, '{{time}}');
    }, [t]);

    const handleViewTicket = () => {
        if (!existingBooking) return;
        navigation.navigate('BookingTicketModal', { booking: existingBooking });
    };

    const handleCancelBooking = () => {
        if (!existingBooking || (existingBooking.status !== 'pending' && existingBooking.status !== 'completed' && existingBooking.status !== 'awaiting_approval')) {
            return;
        }

        const classLabel = existingBooking.classInstanceSnapshot?.name ?? 'this class';
        const paidAmount = existingBooking.paidAmount ?? 0;

        // Calculate cancellation fee based on paid amount (tiered)
        const getCancellationFee = (amountCents: number): number => {
            const euros = amountCents / 100;
            if (euros < 10) return 50; // €0.50
            if (euros <= 20) return 100; // €1.00
            return 200; // €2.00
        };

        // Check for free cancellation privilege (e.g., class was rescheduled)
        const now = Date.now();
        const hasFreeCancel = existingBooking.hasFreeCancel
            && existingBooking.freeCancelExpiresAt
            && now <= existingBooking.freeCancelExpiresAt;

        // Calculate expected refund based on time until class
        const startTime = existingBooking.classInstanceSnapshot?.startTime ?? 0;
        const hoursUntilClass = (startTime - now) / (1000 * 60 * 60);
        const isLateCancel = hoursUntilClass < 12;

        // If hasFreeCancel, user gets 100% refund with no fee
        const refundPercentage = hasFreeCancel ? 100 : (isLateCancel ? 50 : 100);
        const cancellationFee = hasFreeCancel ? 0 : getCancellationFee(paidAmount);
        const grossRefund = Math.round((paidAmount * refundPercentage) / 100);
        const expectedRefund = Math.max(0, grossRefund - cancellationFee);

        // Build informative message about the cancellation policy
        let message = '';
        if (paidAmount > 0) {
            if (hasFreeCancel) {
                // Free cancellation privilege active (class was rescheduled)
                message = `The class was rescheduled. You are eligible for a full refund.\n\n`;
                message += `• Total refund: ${formatEuro(paidAmount)}`;
            } else if (isLateCancel) {
                message = `Late cancellation (less than 12 hours before class).\n\n`;
                message += `• Refund: ${refundPercentage}% of ${formatEuro(paidAmount)} = ${formatEuro(grossRefund)}\n`;
                message += `• Cancellation fee: ${formatEuro(cancellationFee)}\n`;
                message += `• Total refund: ${formatEuro(expectedRefund)}`;
            } else {
                message = `You will receive a refund for this booking.\n\n`;
                message += `• Refund: ${refundPercentage}% of ${formatEuro(paidAmount)} = ${formatEuro(grossRefund)}\n`;
                message += `• Cancellation fee: ${formatEuro(cancellationFee)}\n`;
                message += `• Total refund: ${formatEuro(expectedRefund)}`;
            }
        } else {
            message = t('classes.cancelBookingMessage');
        }

        const options = [t('classes.cancelBooking'), t('classes.keepBooking')];
        const destructiveButtonIndex = 0;
        const cancelButtonIndex = 1;

        showActionSheetWithOptions(
            {
                title: t('classes.cancelBookingTitle', { className: classLabel }),
                message,
                options,
                destructiveButtonIndex,
                cancelButtonIndex,
            },
            async (selectedIndex?: number) => {
                if (selectedIndex !== destructiveButtonIndex) {
                    return;
                }

                try {
                    setIsCancelling(true);
                    const result = await cancelBookingWithRefund({
                        bookingId: existingBooking._id as Id<'bookings'>,
                        reason: 'Cancelled by user via class modal',
                        cancelledBy: 'consumer',
                    });

                    // Show refund confirmation
                    let refundMessage: string;
                    if (result.refundedAmount > 0) {
                        refundMessage = `${formatEuro(result.refundedAmount)} will be refunded to your payment method.`;
                        if (result.cancellationFee > 0) {
                            refundMessage += `\n\nCancellation fee: ${formatEuro(result.cancellationFee)}`;
                        }
                    } else {
                        refundMessage = 'No refund applicable based on the cancellation policy.';
                    }

                    Alert.alert(
                        t('classes.bookingCancelled'),
                        refundMessage
                    );
                } catch (error: any) {
                    const errorMessage =
                        error?.data?.message ||
                        error?.message ||
                        t('classes.cancellationFailedMessage');

                    Alert.alert(t('classes.cancellationFailed'), errorMessage);
                } finally {
                    setIsCancelling(false);
                }
            }
        );
    };

    const handleScroll = (event: any) => {
        const scrollY = event.nativeEvent.contentOffset.y;

        // Calculate opacity based on scroll position
        // 0-100px: opacity 0 (transparent)
        // 100-250px: opacity 0-1 (gradual transition)
        // 250px+: opacity 1 (fully white)
        let opacity = 0;
        if (scrollY > 100) {
            if (scrollY >= 250) {
                opacity = 1;
            } else {
                // Gradual transition from 100px to 250px
                opacity = (scrollY - 100) / 150;
            }
        }

        setHeaderOpacity(opacity);

        // Update the boolean state for other styling
        const shouldBeWhite = scrollY > 100;
        if (shouldBeWhite !== isHeaderWhite) {
            setIsHeaderWhite(shouldBeWhite);
        }
    };

    // Book class using Stripe Payment Sheet (direct EUR payment)
    // NOTE: This useCallback must be called before any conditional returns
    const startStripePayment = useCallback(async (opts?: { questionnaireAnswers?: QuestionAnswer[]; overridePriceCents?: number }) => {
        if (!finalClassInstance || !user) return;

        let pendingBookingId: Id<"pendingBookings"> | null = null;
        let stripePaymentIntentId: string | null = null;

        try {
            setIsBooking(true);

            // DEBUG: Log Stripe publishable key (same source as StripeProvider in App.tsx)
            const stripeKey =
                Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
                (__DEV__ ? "pk_test_D6Fdm4YCR6FZApgnZuJo8M2a" : undefined);
            console.log('🔑 Stripe Publishable Key:', stripeKey);
            console.log('🔑 Key length:', stripeKey?.length);
            console.log('🔑 Key starts with pk_test_:', stripeKey?.startsWith('pk_test_'));

            // Step 1: Create PaymentIntent and reserve seat
            const paymentData = await createClassPaymentIntent({
                classInstanceId: finalClassInstance._id,
                questionnaireAnswers: opts?.questionnaireAnswers?.length ? opts.questionnaireAnswers : undefined,
            });

            pendingBookingId = paymentData.pendingBookingId;
            stripePaymentIntentId = paymentData.paymentIntentClientSecret.split('_secret_')[0];

            // Step 2: Initialize Payment Sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'Kyma Club',
                customerId: paymentData.customerId,
                customerEphemeralKeySecret: paymentData.ephemeralKey,
                paymentIntentClientSecret: paymentData.paymentIntentClientSecret,
                allowsDelayedPaymentMethods: false,
                applePay: Platform.OS === 'ios'
                    ? { merchantCountryCode: 'GR' }
                    : undefined,
                defaultBillingDetails: {
                    email: user.email ?? undefined,
                    name: user.name ?? undefined,
                },
                // Required for iOS redirect payment methods
                returnURL: 'kymaclub://stripe-redirect',
            });

            if (initError) {
                console.error('Payment Sheet init error:', initError);
                throw new Error(initError.message);
            }

            // Step 3: Present Payment Sheet
            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                // User cancelled or payment failed
                if (presentError.code === 'Canceled') {
                    // User cancelled - cancel the reservation
                    if (pendingBookingId && stripePaymentIntentId) {
                        await cancelClassPaymentIntent({
                            pendingBookingId,
                            stripePaymentIntentId,
                        });
                    }
                    return;
                }
                throw new Error(presentError.message);
            }

            // Payment succeeded! Booking will be created by webhook
            const requiresConfirmation = finalClassInstance.requiresConfirmation;
            if (requiresConfirmation) {
                Alert.alert(
                    t('payment.success'),
                    t('classes.requestSentMessage')
                );
            } else {
                Alert.alert(
                    t('payment.success'),
                    t('classes.bookedSuccess')
                );
            }
        } catch (err: any) {
            const message =
                (err?.data && (err.data.message || err.data.code)) ||
                err?.message ||
                t('payment.paymentFailedMessage');
            Alert.alert(t('payment.paymentFailed'), String(message));

            // Cancel reservation if it was created
            if (pendingBookingId && stripePaymentIntentId) {
                try {
                    await cancelClassPaymentIntent({
                        pendingBookingId,
                        stripePaymentIntentId,
                    });
                } catch (cancelErr) {
                    console.error('Failed to cancel reservation:', cancelErr);
                }
            }
        } finally {
            setIsBooking(false);
        }
    }, [finalClassInstance, user, createClassPaymentIntent, cancelClassPaymentIntent, initPaymentSheet, presentPaymentSheet, t]);

    const handleDirectBooking = useCallback(async (opts?: { questionnaireAnswers?: QuestionAnswer[]; overridePriceCents?: number }) => {
        if (!finalClassInstance || !user) return;

        const finalPriceCents = opts?.overridePriceCents ?? discountResult.finalPriceCents;
        const priceDisplay = formatEuro(finalPriceCents);

        const options = [t('classes.payWithStripe', { price: priceDisplay }), t('common.cancel')];
        const cancelButtonIndex = 1;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex,
        }, async (selectedIndex?: number) => {
            if (selectedIndex === 0) {
                await startStripePayment(opts);
            }
        });
    }, [finalClassInstance, user, discountResult.finalPriceCents, showActionSheetWithOptions, startStripePayment, t]);

    // If the user completed the questionnaire modal, start the exact same Stripe flow from here.
    useFocusEffect(
        useCallback(() => {
            if (!finalClassInstance) return;
            const pending = consumePendingQuestionnaireBooking(String(finalClassInstance._id));
            if (!pending) return;
            // Wait for the navigation transition to complete; otherwise ActionSheet/PaymentSheet can flash-dismiss.
            InteractionManager.runAfterInteractions(() => {
                void startStripePayment({
                    questionnaireAnswers: pending.answers,
                    overridePriceCents: pending.totalPriceInCents,
                });
            });
        }, [finalClassInstance, startStripePayment])
    );

    // NOW we can do conditional returns, after ALL hooks have been called
    if (!finalClassInstance && !classInstanceId) {
        return (
            <View style={styles.container}>
                <View style={styles.fixedHeader}>
                    <TouchableOpacity
                        style={styles.headerBackButton}
                        activeOpacity={0.9}
                        onPress={() => navigation.goBack()}

                    >
                        <ChevronLeftIcon
                            size={24}
                            color="#111827"
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>{t('classes.noClassInfo')}</Text>
                </View>
            </View>
        );
    }

    if (!finalClassInstance) {
        return (
            <View style={styles.container}>
                <View style={styles.fixedHeader}>
                    <TouchableOpacity
                        style={styles.headerBackButton}
                        activeOpacity={0.9}
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeftIcon
                            size={24}
                            color="#111827"
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>{t('classes.loadingClassDetails')}</Text>
                </View>
            </View>
        );
    }

    // Calculate derived values
    // Note: templateSnapshot only stores shortDescription, not full description
    const className = finalClassInstance.name ?? templateSnapshot?.name ?? t('classes.title');
    const description = finalClassInstance.description ?? '';
    const shortDescription = finalClassInstance.shortDescription ?? templateSnapshot?.shortDescription ?? '';
    const instructor = finalClassInstance.instructor ?? templateSnapshot?.instructor ?? 'TBD';
    const capacity = finalClassInstance.capacity ?? 0;
    const price = finalClassInstance.price ?? 0;
    const businessName = venue?.name ?? finalClassInstance.venueSnapshot?.name ?? t('venues.unknownVenue');
    // Get date-fns locale based on current language
    const currentLanguage = i18n.language || 'en';
    const dateFnsLocale = getDateFnsLocale(currentLanguage);

    const startTime = new Date(finalClassInstance.startTime);
    let whenStr: string;
    try {
        whenStr = format(startTime, 'eeee, dd MMMM, HH:mm', {
            in: tz('Europe/Athens'),
            locale: dateFnsLocale
        });
    } catch (e) {
        console.warn('Error formatting whenStr:', e);
        whenStr = format(startTime, 'eeee, dd MMMM, HH:mm', { locale: dateFnsLocale });
    }

    const cancelUntilStr = finalClassInstance.cancellationWindowHours != null
        ? (() => {
            const cancelUntilDate = new Date(
                finalClassInstance.startTime - finalClassInstance.cancellationWindowHours * 60 * 60 * 1000,
            );
            try {
                return format(cancelUntilDate, 'eeee, dd MMMM, HH:mm', {
                    in: tz('Europe/Athens'),
                    locale: dateFnsLocale
                });
            } catch (e) {
                console.warn('Error formatting cancelUntilStr:', e);
                return format(cancelUntilDate, 'eeee, dd MMMM, HH:mm', { locale: dateFnsLocale });
            }
        })()
        : null;
    const duration = Math.round((finalClassInstance.endTime - finalClassInstance.startTime) / (1000 * 60));
    const priceEur = formatEuro(price);
    const spotsLeft = Math.max(0, capacity - (finalClassInstance.bookedCount ?? 0));
    const isLoading = (allImageIds.length > 0 && !imageUrlsQuery) || existingBooking === undefined;

    // Event handlers
    const onPress = () => {
        if (!finalClassInstance) return;

        // Check if user is signed in
        if (!user) {
            Alert.alert(t('classes.signInRequired'), t('classes.signInRequiredMessage'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('classes.signIn'), onPress: () => navigation.navigate('SignInModal') }
            ]);
            return;
        }

        // If there's a questionnaire, navigate to questionnaire modal
        if (effectiveQuestionnaire.length > 0) {
            const basePriceCents = discountResult.finalPriceCents;
            (navigation as NativeStackNavigationProp<RootStackParamList>).navigate('QuestionnaireModal', {
                questions: effectiveQuestionnaire,
                basePrice: basePriceCents, // Pass cents, questionnaire will handle display
                className,
                classInstanceId: finalClassInstance._id,
            });
            return;
        }

        // Otherwise, proceed with direct booking
        handleDirectBooking();
    };



    return (
        <View style={styles.container}>
            {/* Fixed Header Row */}
            <View style={[
                styles.fixedHeader,
                {
                    backgroundColor: `rgba(255, 255, 255, ${headerOpacity})`,
                    borderBottomWidth: headerOpacity > 0 ? 1 : 0,
                    borderBottomColor: `rgba(229, 231, 235, ${headerOpacity})`,
                }
            ]}>
                <TouchableOpacity
                    style={[
                        styles.headerBackButton,
                        {
                            backgroundColor: `rgba(255, 255, 255, ${0.5 - (headerOpacity * 0.5)})`,
                        }
                    ]}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeftIcon
                        size={26}
                        color={theme.colors.zinc[950]}
                    />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>{t('classes.loadingClassDetails')}</Text>
                </View>
            ) : (
                <>
                    <ScrollView
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {/* Image Carousel - Full Width */}
                        {imageUrls.length > 0 ? (
                            <View style={styles.fullWidthCarouselContainer}>
                                <Carousel
                                    width={screenWidth}
                                    height={360}
                                    data={imageUrls}
                                    renderItem={({ item: imageUrl }) => (
                                        <Image
                                            source={{ uri: imageUrl }}
                                            style={styles.fullWidthImage}
                                            contentFit="cover"
                                            transition={300}
                                            cachePolicy="memory-disk"
                                        />
                                    )}
                                    loop={imageUrls.length > 1}
                                    pagingEnabled
                                    snapEnabled
                                    autoPlay={false}
                                    onSnapToItem={(index) => setCurrentImageIndex(index)}
                                />
                                {imageUrls.length > 1 && (
                                    <View style={styles.carouselDots}>
                                        {imageUrls.map((_, index) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.dot,
                                                    index === currentImageIndex && styles.activeDot
                                                ]}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={styles.fullWidthPlaceholderContainer}>
                                <View style={styles.fullWidthPlaceholderImage}>
                                    <Text style={styles.placeholderText}>No Images Available</Text>
                                </View>
                            </View>
                        )}


                        {/* Class Info Section */}
                        <View style={styles.classInfoSection}>
                            <View style={styles.priceInfoSection}>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.priceLabel}>{t('classes.price')}</Text>
                                    {discountResult.appliedDiscount ? (
                                        <View style={styles.priceComparisonRow}>
                                            <Text style={styles.originalPriceModal}>
                                                {formatEuro(discountResult.originalPriceCents)}
                                            </Text>
                                            <Text style={styles.discountedPriceModal}>
                                                {formatEuro(discountResult.finalPriceCents)}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.priceValue}>{priceEur}</Text>
                                    )}
                                </View>
                                <View style={styles.spotsContainer}>
                                    <Text style={styles.spotsLabel}>{t('classes.availableSpots')}</Text>
                                    <Text style={styles.spotsValue}>
                                        {t('classes.spotsLeft', { count: spotsLeft })}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.separator} />
                            {/* Class Name - Centered */}
                            <Text style={styles.className}>{className}</Text>


                            {/* Class Short Description - Centered */}
                            {shortDescription ? (
                                <Text style={styles.classDescription}>
                                    {shortDescription}
                                </Text>
                            ) : (
                                <Text style={styles.classDescription} numberOfLines={3}>
                                    {description || t('classes.joinClassDescription', { instructor, businessName })}
                                </Text>
                            )}
                        </View>

                        {/* Separator */}
                        <View style={{ paddingHorizontal: 16 }}>
                            <View style={styles.separator} />
                        </View>

                        {/* White Content Section with Rounded Top Corners */}
                        <View style={styles.whiteContentSection}>

                            {/* Discount Banner */}
                            {discountResult.appliedDiscount && (
                                <View style={styles.discountBanner}>
                                    <Text style={styles.discountBannerText}>
                                        {getDiscountTimingText(
                                            discountResult,
                                            finalClassInstance,
                                            timeUnitDays,
                                            timeUnitHours,
                                            timeUnitMinutes,
                                            t
                                        )}
                                    </Text>
                                </View>
                            )}

                            {/* Booking Window Banner */}
                            {getBookingWindowText(
                                finalClassInstance,
                                closesInTemplate,
                                timeUnitDays,
                                timeUnitHours,
                                timeUnitMinutes
                            ) && (
                                    <View style={styles.bookingWindowBanner}>
                                        <Text style={styles.bookingWindowBannerText}>
                                            {getBookingWindowText(
                                                finalClassInstance,
                                                closesInTemplate,
                                                timeUnitDays,
                                                timeUnitHours,
                                                timeUnitMinutes
                                            )}
                                        </Text>
                                    </View>
                                )}

                            {/* Tournament Widget Banner */}
                            {hasTournament && widget && (
                                <TouchableOpacity
                                    style={[
                                        styles.widgetBanner,
                                        !discountResult.appliedDiscount && !getBookingWindowText(
                                            finalClassInstance,
                                            closesInTemplate,
                                            timeUnitDays,
                                            timeUnitHours,
                                            timeUnitMinutes
                                        ) && styles.widgetBannerFirst
                                    ]}
                                    onPress={() => navigation.navigate('Tournament', { widgetId: widget._id })}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.widgetBannerContent}>
                                        <View style={styles.widgetBannerLeft}>
                                            <Trophy size={28} color="#ffffff" />
                                            <View>
                                                <Text style={styles.widgetBannerTitle}>
                                                    {widget.widgetConfig.type === 'tournament_americano' ? 'Americano Tournament' : 'Tournament'}
                                                </Text>
                                                <Text style={styles.widgetBannerSubtext}>
                                                    {widget.status === 'setup' && 'Setting up • Tap to view'}
                                                    {widget.status === 'ready' && 'Ready to start • Tap to view'}
                                                    {widget.status === 'active' && 'In progress • Tap to view'}
                                                    {widget.status === 'completed' && 'Completed • View results'}
                                                </Text>
                                            </View>
                                        </View>
                                        <ChevronLeftIcon size={20} color="rgba(255, 255, 255, 0.7)" style={{ transform: [{ rotate: '180deg' }] }} />
                                    </View>
                                </TouchableOpacity>
                            )}

                            {/* Key details */}
                            <View style={styles.detailsList}>
                                <View style={styles.detailItem}>
                                    <Calendar1Icon style={styles.calendarIcon} size={20} />
                                    <Text style={styles.detailText}>{t('classes.date')}: {whenStr}</Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <ClockIcon style={styles.clockIcon} size={20} />
                                    <Text style={styles.detailText}>{t('classes.durationMinutes', { minutes: duration })}</Text>
                                </View>

                                {cancelUntilStr && (
                                    <View style={styles.detailItem}>
                                        <CalendarOffIcon style={styles.calendarOffIcon} size={20} />
                                        <Text style={styles.detailText}>{t('classes.cancelUntil', { time: cancelUntilStr })}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Separator */}
                            <View style={{ paddingHorizontal: 16 }}>
                                <View style={styles.separator} />
                            </View>


                            {/* Description and Amenities Section */}
                            <View style={styles.detailsSection}>
                                {description && (
                                    <View style={styles.descriptionContainer}>
                                        <Text style={styles.sectionTitle}>{t('classes.about')}</Text>
                                        <Text style={styles.descriptionText}>{description}</Text>
                                    </View>
                                )}

                                {/* Amenities */}
                                {venue?.amenities && Object.entries(venue.amenities).some(([_, enabled]) => enabled) && (
                                    <View style={styles.amenitiesContainer}>
                                        <Text style={styles.sectionTitle}>{t('classes.amenities')}</Text>
                                        <View style={styles.tagContainer}>
                                            {Object.entries(venue.amenities)
                                                .filter(([_, enabled]) => enabled)
                                                .map(([amenity, _]) => (
                                                    <View key={amenity} style={styles.tag}>
                                                        <Text style={styles.tagText}>
                                                            {amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                        </Text>
                                                    </View>
                                                ))}
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Booking History Section */}
                            {bookingHistory && bookingHistory.length > 1 && (
                                <View style={styles.bookingHistorySection}>
                                    <Text style={styles.sectionTitle}>{t('classes.bookingHistory')}</Text>
                                    <View style={styles.bookingHistoryList}>
                                        {bookingHistory.map((booking, index) => (
                                            <View key={booking._id} style={styles.bookingHistoryItem}>
                                                <View style={styles.bookingHistoryLeft}>
                                                    <Text style={styles.bookingHistoryStatus}>
                                                        {booking.status === "awaiting_approval" && t('classes.waitingForApproval')}
                                                        {booking.status === "pending" && t('classes.currentBooking')}
                                                        {booking.status === "completed" && t('classes.completed')}
                                                        {booking.status === "cancelled_by_consumer" && t('classes.youCancelled')}
                                                        {booking.status === "cancelled_by_business" && t('classes.cancelledByStudio')}
                                                        {booking.status === "cancelled_by_business_rebookable" && t('classes.cancelledByStudio')}
                                                        {booking.status === "rejected_by_business" && t('classes.rejectedByStudio')}
                                                        {booking.status === "no_show" && t('classes.noShow')}
                                                    </Text>
                                                    <Text style={styles.bookingHistoryDate}>
                                                        {(() => {
                                                            try {
                                                                return format(new Date(booking.createdAt), 'MMM d, yyyy \'at\' h:mm a', {
                                                                    in: tz('Europe/Athens')
                                                                });
                                                            } catch (e) {
                                                                return format(new Date(booking.createdAt), 'MMM d, yyyy \'at\' h:mm a');
                                                            }
                                                        })()}
                                                    </Text>
                                                    {booking.cancelByBusinessReason && (
                                                        <Text style={styles.bookingHistoryReason}>
                                                            {booking.cancelByBusinessReason}
                                                        </Text>
                                                    )}
                                                </View>
                                                <Text style={styles.bookingHistoryPrice}>
                                                    {formatEuro(booking.finalPrice)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Same Class Section - Other instances from same template */}
                            {sameClassInstances && sameClassInstances.length > 0 && (
                                <>
                                    <Divider />
                                    <View style={styles.sameClassSection}>
                                        <Text style={styles.sameClassSectionTitle}>
                                            {t('classes.sameClassOtherDates')}
                                        </Text>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.sameClassScrollContent}
                                        >
                                            {sameClassInstances.map((instance) => (
                                                <SameClassCard
                                                    key={instance._id}
                                                    startTime={instance.startTime}
                                                    spotsAvailable={instance.spotsAvailable}
                                                    isBookedByUser={instance.isBookedByUser}
                                                    onPress={() => {
                                                        navigation.navigate('ClassDetailsModal', {
                                                            classInstanceId: instance._id
                                                        });
                                                    }}
                                                />
                                            ))}
                                        </ScrollView>
                                    </View>
                                </>
                            )}

                            {/* Other Classes from Venue Section */}
                            {venue && classOfferings.length > 0 && (
                                <>
                                    <Divider />
                                    <View style={styles.otherClassesSection}>
                                        <Text style={styles.sectionTitle}>
                                            {t('venues.otherLessonsFrom')} <Text style={styles.sectionTitleBold}>{venue.name}</Text>
                                        </Text>
                                        {classOfferings.map((offering) => {
                                            const imageId = offering.imageStorageIds?.[0];
                                            const imageUrl = imageId ? offeringStorageIdToUrl.get(imageId) : null;

                                            return (
                                                <TouchableOpacity
                                                    key={offering.templateId}
                                                    style={styles.offeringItem}
                                                    activeOpacity={0.7}
                                                    onPress={() => {
                                                        navigation.navigate('VenueClassInstancesModal', {
                                                            venueId: venue._id,
                                                            venueName: venue.name,
                                                            templateId: offering.templateId,
                                                        });
                                                    }}
                                                >
                                                    <Image
                                                        source={imageUrl ? { uri: imageUrl } : undefined}
                                                        style={styles.offeringImage}
                                                        contentFit="cover"
                                                        transition={200}
                                                    />
                                                    <View style={styles.offeringInfo}>
                                                        <Text style={styles.offeringName}>{offering.name}</Text>
                                                        <View style={styles.offeringDetailsRow}>
                                                            <EuroIcon size={14} color={theme.colors.zinc[500]} />
                                                            <Text style={styles.offeringPrice}>{formatEuro(offering.price)}</Text>
                                                            <View style={styles.offeringDotSeparator} />
                                                            <ClockIcon size={14} color={theme.colors.zinc[500]} />
                                                            <Text style={styles.offeringDuration}>{offering.duration} min</Text>
                                                        </View>
                                                        {offering.shortDescription && (
                                                            <Text style={styles.offeringDescription} numberOfLines={2}>
                                                                {offering.shortDescription}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </>
                            )}

                        </View>
                        {/* Bottom padding to account for sticky button */}
                        <View style={styles.bottomPadding} />
                    </ScrollView>

                    {/* Sticky Button - Book or Already Attending */}
                    <View style={[styles.stickyButtonContainer, { bottom: Platform.OS === 'ios' ? bottomInset + 8 : Math.max(bottomInset, 24) + 24 }]}>
                        {existingBooking ? (
                            existingBooking.status === "awaiting_approval" ? (
                                /* Awaiting Approval Container */
                                <View style={styles.alreadyAttendingContainer}>
                                    <View style={styles.attendingTitleContainer}>
                                        <ClockIcon size={22} color={theme.colors.zinc[600]} />
                                        <Text style={styles.alreadyAttendingTitle}>
                                            {t('classes.waitingForApproval')}
                                        </Text>
                                    </View>
                                    <View style={styles.attendingActionsRow}>
                                        <TouchableOpacity
                                            style={[styles.attendingSecondaryButton, isCancelling && styles.attendingSecondaryButtonDisabled]}
                                            onPress={handleCancelBooking}
                                            activeOpacity={0.85}
                                            disabled={isCancelling}
                                        >
                                            <Text style={styles.attendingSecondaryText}>
                                                {isCancelling ? t('classes.cancelling') : t('classes.cancelBooking')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : existingBooking.status === "pending" || existingBooking.status === "completed" ? (
                                /* Already Attending Container */
                                <View style={styles.alreadyAttendingContainer}>
                                    <View style={styles.attendingTitleContainer}>
                                        <CheckCircleIcon size={22} color={theme.colors.emerald[600]} />
                                        <Text style={styles.alreadyAttendingTitle}>
                                            {existingBooking.status === "completed" ? t('classes.checkedIn') : t('classes.youreAttending')}
                                        </Text>
                                    </View>
                                    <View style={styles.attendingActionsRow}>
                                        <TouchableOpacity
                                            style={styles.attendingPrimaryButton}
                                            onPress={handleViewTicket}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={styles.attendingPrimaryText}>{t('classes.ticket')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.attendingSecondaryButton, isCancelling && styles.attendingSecondaryButtonDisabled]}
                                            onPress={handleCancelBooking}
                                            activeOpacity={0.85}
                                            disabled={isCancelling}
                                        >
                                            <Text style={styles.attendingSecondaryText}>
                                                {isCancelling ? t('classes.cancelling') : t('classes.cancelBooking')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                (existingBooking.status === "cancelled_by_consumer" || existingBooking.status === "cancelled_by_business_rebookable") ? (
                                    /* Rebookable Container - Allow rebooking */
                                    <TouchableOpacity
                                        style={styles.rebookContainer}
                                        onPress={onPress}
                                        activeOpacity={0.8}
                                        disabled={isBooking}
                                    >
                                        <Text style={styles.rebookTitle}>
                                            {existingBooking.status === "cancelled_by_consumer" && t('classes.youCancelled')}
                                            {existingBooking.status === "cancelled_by_business_rebookable" && t('classes.cancelledByStudio')}
                                        </Text>
                                        <Text style={styles.rebookSubtext}>
                                            {isBooking ? t('classes.rebooking') : t('classes.tapToRebook')}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    /* Status Display Container - Not clickable */
                                    <View style={styles.statusContainer}>
                                        <View style={styles.statusTitleContainer}>
                                            {existingBooking.status === "cancelled_by_business" && <Text style={styles.statusTitle}>{t('classes.cancelledByStudio')}</Text>}
                                            {existingBooking.status === "no_show" && <Text style={styles.statusTitle}>{t('classes.noShow')}</Text>}
                                            {existingBooking.status === "rejected_by_business" && <Text style={styles.statusTitle}>{t('classes.requestRejected')}</Text>}
                                        </View>
                                        {existingBooking.status === "no_show" ? (
                                            <Text style={styles.statusSubtext}>{t('classes.didntShowUp')}</Text>
                                        ) : existingBooking.status === "rejected_by_business" && existingBooking.rejectByBusinessReason ? (
                                            <Text style={styles.statusSubtext}>Note: "{existingBooking.rejectByBusinessReason}"</Text>
                                        ) : existingBooking.status === "cancelled_by_business" && existingBooking.cancelByBusinessReason ? (
                                            <Text style={styles.statusSubtext}>Note: "{existingBooking.cancelByBusinessReason}"</Text>
                                        ) : null}
                                    </View>
                                )
                            )
                        ) : (
                            /* Book Class Button */
                            <TouchableOpacity
                                style={[styles.bookButton, spotsLeft === 0 && styles.bookButtonDisabled]}
                                disabled={spotsLeft === 0 || isBooking}
                                activeOpacity={0.8}
                                onPress={onPress}
                            >
                                <View style={styles.bookButtonLeft}>
                                    <Text style={[styles.bookButtonText, spotsLeft === 0 && styles.bookButtonTextDisabled]}>
                                        {spotsLeft === 0 ? t('classes.fullyBooked') : isBooking ? t('classes.booking') : t('classes.bookClass')}
                                    </Text>
                                </View>
                                {spotsLeft > 0 && (
                                    <View style={styles.bookButtonPriceContainer}>
                                        {discountResult.appliedDiscount ? (
                                            <View style={styles.bookButtonDiscountPriceRow}>
                                                <View style={styles.bookButtonOriginalPrice}>
                                                    <Text style={styles.bookButtonOriginalText}>{formatEuro(discountResult.originalPriceCents)}</Text>
                                                </View>
                                                <View style={styles.bookButtonFinalPrice}>
                                                    <Text style={styles.bookButtonSubtext}>{formatEuro(discountResult.finalPriceCents)}</Text>
                                                </View>
                                            </View>
                                        ) : (
                                            <Text style={styles.bookButtonSubtext}>{priceEur}</Text>
                                        )}
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100, // Height to accommodate status bar + header
        paddingTop: 48, // Status bar height
        paddingHorizontal: 20,
        zIndex: 1000,
        backgroundColor: 'transparent',
    },
    headerBackButton: {
        width: 36,
        height: 36,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    contentContainer: {
        paddingBottom: 140,
    },
    fullWidthCarouselContainer: {
        marginBottom: 0,
    },
    fullWidthImage: {
        width: screenWidth,
        height: 360,
    },
    fullWidthPlaceholderContainer: {
        marginBottom: 0,
    },
    fullWidthPlaceholderImage: {
        width: screenWidth,
        height: 360,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    classInfoSection: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
        backgroundColor: '#fafafa',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24, // Overlap the image slightly for overlay effect
        position: 'relative',
        zIndex: 1,
    },
    className: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.zinc[950],
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    classDescription: {
        fontSize: 16,
        fontWeight: '400',
        color: theme.colors.zinc[700],
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 8,
    },
    whiteContentSection: {
        backgroundColor: theme.colors.zinc[50],
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        position: 'relative',
        zIndex: 1,
    },
    separator: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    discountBanner: {
        backgroundColor: theme.colors.amber[500],
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 0,
        marginTop: -14,
        width: screenWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    discountBannerText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        textAlign: 'center',
    },
    bookingWindowBanner: {
        backgroundColor: theme.colors.sky[500],
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 8,
        marginTop: 0,
        width: screenWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookingWindowBannerText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        textAlign: 'center',
    },
    widgetBanner: {
        backgroundColor: '#7c3aed', // violet-600
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginBottom: 8,
        marginTop: 0,
        width: screenWidth,
    },
    widgetBannerFirst: {
        marginTop: -14,
    },
    widgetBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    widgetBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    widgetBannerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    widgetBannerIconText: {
        fontSize: 18,
    },
    widgetBannerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    widgetBannerSubtext: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 1,
    },
    carouselContainer: {
        marginBottom: 16,
    },
    imageContainer: {
        width: screenWidth,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: screenWidth - 32,
        height: 250,
        borderRadius: 12,
    },
    carouselDots: {
        position: 'absolute',
        bottom: 18,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        zIndex: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    activeDot: {
        backgroundColor: '#ffffff',
        width: 20,
        height: 6,
        borderRadius: 3,
    },
    placeholderContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    placeholderImage: {
        width: '100%',
        height: 250,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    section: {
        gap: 4,
        paddingHorizontal: 16,
    },
    sectionRow: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 16,
    },
    sectionHalf: {
        flex: 1,
        gap: 4,
    },
    label: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
    },
    subValue: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    tag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    tagText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
    },
    priceInfoSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#f8fafc',
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    detailsList: {
        paddingHorizontal: 32,
        paddingTop: 12,
        paddingBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
        paddingTop: 2,
    },
    calendarIcon: {
        marginRight: 10,
        color: '#444444',
        width: 20,
        height: 20,
    },
    clockIcon: {
        marginRight: 10,
        color: '#444444',
        width: 20,
        height: 20,
    },
    calendarOffIcon: {
        marginRight: 10,
        color: '#444444',
        width: 20,
        height: 20,
    },
    detailText: {
        fontSize: 14,
        color: theme.colors.zinc[700],
        fontWeight: '400',
        flex: 1,
    },
    businessSection: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    businessName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    locationText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '400',
    },
    timeSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dateTime: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    duration: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    keyInfoSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 2,
        marginBottom: 4,
    },
    spotsLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 2,
        marginBottom: 4,
    },
    priceValue: {
        marginTop: 2,
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.zinc[950],
    },
    spotsContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    spotsValue: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.emerald[500],
    },
    detailsSection: {
        paddingTop: 8,
    },
    descriptionContainer: {
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 10,
    },
    sectionTitleBold: {
        fontWeight: '700',
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#374151',
        fontWeight: '400',
    },
    amenitiesContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    rulesContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    ruleText: {
        fontSize: 15,
        color: '#6b7280',
        fontWeight: '400',
        marginBottom: 4,
    },
    bottomPadding: {
        height: 20,
    },
    stickyButtonContainer: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        paddingHorizontal: 0,
        paddingBottom: 0,
        backgroundColor: 'transparent',
        shadowColor: 'transparent',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    bookButton: {
        backgroundColor: theme.colors.zinc[800],
        borderRadius: 40,
        height: 56,
        paddingHorizontal: 28,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    bookButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bookButtonPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    bookButtonDisabled: {
        backgroundColor: '#d1d5db',
        shadowOpacity: 0,
        elevation: 0,
    },
    bookButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    bookButtonTextDisabled: {
        color: '#9ca3af',
    },
    bookButtonSubtext: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    alreadyAttendingContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    attendingTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    alreadyAttendingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.zinc[950],
        marginBlock: 4
    },
    attendingActionsRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        justifyContent: 'center',
    },
    attendingPrimaryButton: {
        flex: 1,
        backgroundColor: theme.colors.emerald[500],
        paddingVertical: 12,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    attendingPrimaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
    attendingSecondaryButton: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    attendingSecondaryButtonDisabled: {
        opacity: 0.6,
    },
    attendingSecondaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.zinc[700],
    },
    statusContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        paddingHorizontal: 28,
        paddingVertical: 16,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    statusTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.zinc[950],
    },
    statusSubtext: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.zinc[700],
        textAlign: 'center',
        marginTop: 6,
    },
    rebookContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        height: 56,
        paddingHorizontal: 28,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    rebookTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.zinc[950],
        textAlign: 'center',
    },
    rebookSubtext: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.zinc[700],
        textAlign: 'center',
        marginTop: 2,
    },
    bookingHistorySection: {
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    bookingHistoryList: {
        marginTop: 12,
    },
    bookingHistoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    bookingHistoryLeft: {
        flex: 1,
        marginRight: 12,
    },
    bookingHistoryStatus: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    bookingHistoryDate: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    bookingHistoryReason: {
        fontSize: 11,
        fontStyle: 'italic',
        color: '#9ca3af',
        marginTop: 2,
    },
    bookingHistoryPrice: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    discountTimingTextModal: {
        fontSize: 12,
        color: theme.colors.amber[500],
        fontWeight: '600',
        marginTop: 4,
    },
    priceComparisonRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    originalPriceModal: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.zinc[400],
        textDecorationLine: 'line-through',
    },
    discountedPriceModal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.zinc[950],
    },
    priceText: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.zinc[950],
    },
    bookButtonDiscountPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bookButtonOriginalPrice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    bookButtonOriginalText: {
        fontSize: 18,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.7)',
        textDecorationLine: 'line-through',
    },
    bookButtonFinalPrice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    // Same Class Section styles
    sameClassSection: {
        paddingTop: 12,
        paddingBottom: 0,
    },
    sameClassSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    sameClassScrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 20,
    },
    // Other Classes Section styles
    otherClassesSection: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
    },
    offeringItem: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'center',
    },
    offeringImage: {
        width: 80,
        height: 76,
        borderRadius: 12,
        marginRight: 14,
        backgroundColor: '#f3f4f6',
    },
    offeringInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    offeringName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.zinc[900],
        marginBottom: 6,
    },
    offeringDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    offeringPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.zinc[600],
        marginLeft: 6,
    },
    offeringDuration: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.zinc[600],
        marginLeft: 6,
    },
    offeringDotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#d1d5db',
        marginHorizontal: 10,
    },
    offeringDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },
});
