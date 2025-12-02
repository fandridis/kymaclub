import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Calendar1Icon, ClockIcon, CalendarOffIcon, DiamondIcon, ChevronLeftIcon, CheckCircleIcon, ArrowLeftIcon } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Carousel from 'react-native-reanimated-carousel';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { el } from 'date-fns/locale/el';
import { tz } from '@date-fns/tz';
import type { RootStackParamList } from '..';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { centsToCredits } from '@repo/utils/credits';
import { theme } from '../../theme';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCancellationInfo, getCancellationMessage, getCancellationTranslations } from '../../utils/cancellationUtils';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { useTypedTranslation } from '../../i18n/typed';
import i18n from '../../i18n';
import type { Question } from '@repo/api/types/questionnaire';
import { getEffectiveQuestionnaire } from '@repo/api/operations/questionnaire';

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

// Discount calculation result
type DiscountCalculationResult = {
    originalPrice: number;
    finalPrice: number;
    appliedDiscount: {
        discountValue: number;
        creditsSaved: number;
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

    if (ruleName.toLowerCase().includes('early')) {
        return t('classes.earlyBirdDiscount', { time: formattedTime });
    } else if (ruleName.toLowerCase().includes('last') || ruleName.toLowerCase().includes('minute')) {
        return t('classes.lastMinuteDiscount', { time: formattedTime });
    } else {
        return t('classes.discountActive', { time: formattedTime });
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
    const originalPrice = centsToCredits(priceInCents);

    if (!classInstance) {
        return {
            originalPrice,
            finalPrice: originalPrice,
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
            originalPrice,
            finalPrice: originalPrice,
            appliedDiscount: null,
        };
    }

    const bestRule = findBestDiscountRule(discountRules, hoursUntilClass);

    if (!bestRule) {
        return {
            originalPrice,
            finalPrice: originalPrice,
            appliedDiscount: null,
        };
    }

    const discountValueInCredits = centsToCredits(bestRule.rule.discount.value);
    const finalPrice = Math.max(0, originalPrice - discountValueInCredits);
    const creditsSaved = originalPrice - finalPrice;

    return {
        originalPrice,
        finalPrice,
        appliedDiscount: {
            discountValue: discountValueInCredits,
            creditsSaved,
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
    const bookClass = useMutation(api.mutations.bookings.bookClass);
    const cancelBookingMutation = useMutation(api.mutations.bookings.cancelBooking);
    const [isBooking, setIsBooking] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isHeaderWhite, setIsHeaderWhite] = useState(false);
    const [headerOpacity, setHeaderOpacity] = useState(0);
    const { bottom: bottomInset } = useSafeAreaInsets();

    // Fetch classInstance if not provided directly
    const fetchedClassInstance = useQuery(
        api.queries.classInstances.getConsumerClassInstanceById,
        classInstance || !classInstanceId ? "skip" : { instanceId: classInstanceId }
    );

    console.log('fetchedClassInstance', fetchedClassInstance?.disableBookings);

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

    // Fetch template to get questionnaire (use public query for consumer access)
    const template = useQuery(
        api.queries.classTemplates.getClassTemplateByIdPublic,
        finalClassInstance ? { templateId: finalClassInstance.templateId } : "skip"
    );

    // Get effective questionnaire (instance overrides template)
    const effectiveQuestionnaire = useMemo(() => {
        return getEffectiveQuestionnaire(
            template?.questionnaire as Question[] | undefined,
            finalClassInstance?.questionnaire as Question[] | undefined
        ) || [];
    }, [template?.questionnaire, finalClassInstance?.questionnaire]);

    // Get image IDs with null-safe access
    const templateSnapshot = finalClassInstance?.templateSnapshot;
    const templateImageIds = templateSnapshot?.imageStorageIds ?? [];
    const venueImageIds = venue?.imageStorageIds ?? finalClassInstance?.venueSnapshot?.imageStorageIds ?? [];
    const allImageIds = [...templateImageIds, ...venueImageIds];

    const imageUrlsQuery = useQuery(
        api.queries.uploads.getUrls,
        allImageIds.length > 0 ? { storageIds: allImageIds } : "skip"
    );

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
        if (!existingBooking || (existingBooking.status !== 'pending' && existingBooking.status !== 'completed')) {
            return;
        }

        const classLabel = existingBooking.classInstanceSnapshot?.name ?? 'this class';

        // Always calculate cancellation info to show accurate refund message
        let message = t('classes.cancelBookingMessage');

        if (existingBooking.classInstanceSnapshot?.startTime) {
            const cancellationInfo = getCancellationInfo(
                existingBooking.classInstanceSnapshot.startTime,
                existingBooking.classInstanceSnapshot.cancellationWindowHours ?? null,
                existingBooking.hasFreeCancel,
                existingBooking.freeCancelExpiresAt,
                existingBooking.freeCancelReason
            );

            const cancellationTranslations = getCancellationTranslations(t);
            message = getCancellationMessage(classLabel, cancellationInfo, cancellationTranslations);
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
                    await cancelBookingMutation({
                        bookingId: existingBooking._id as Id<'bookings'>,
                        reason: 'Cancelled by user via class modal',
                        cancelledBy: 'consumer',
                    });

                    Alert.alert(
                        t('classes.bookingCancelled'),
                        t('classes.bookingCancelledMessage')
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
    const className = finalClassInstance.name ?? templateSnapshot?.name ?? t('classes.title');
    const description = finalClassInstance.description ?? templateSnapshot?.description ?? '';
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
    const priceCredits = centsToCredits(price);
    const spotsLeft = Math.max(0, capacity - (finalClassInstance.bookedCount ?? 0));
    const isLoading = (allImageIds.length > 0 && !imageUrlsQuery) || existingBooking === undefined;

    // Book class without questionnaire (direct booking)
    const handleDirectBooking = useCallback(async () => {
        if (!finalClassInstance || !user) return;

        const finalPrice = discountResult.appliedDiscount ? discountResult.finalPrice : priceCredits;
        const options = [t('classes.spendCredits', { credits: finalPrice }), t('common.cancel')];
        const cancelButtonIndex = 1;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex,
        }, async (selectedIndex?: number) => {
            if (selectedIndex === undefined) return;

            switch (selectedIndex) {
                case 0: {
                    try {
                        setIsBooking(true);
                        await bookClass({
                            classInstanceId: finalClassInstance._id,
                            description: `Booking for ${className}`,
                        });
                        Alert.alert(t('classes.booked'), t('classes.bookedSuccess'));
                    } catch (err: any) {
                        const message =
                            (err?.data && (err.data.message || err.data.code)) ||
                            err?.message ||
                            t('classes.bookingFailedMessage');
                        Alert.alert(t('classes.bookingFailed'), String(message));
                    } finally {
                        setIsBooking(false);
                    }
                    break;
                }

                case cancelButtonIndex:
                    break;
            }
        });
    }, [finalClassInstance, user, discountResult, priceCredits, bookClass, showActionSheetWithOptions, className, t]);

    // Book class with questionnaire answers
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
            const basePrice = discountResult.appliedDiscount ? discountResult.finalPrice : priceCredits;
            (navigation as NativeStackNavigationProp<RootStackParamList>).navigate('QuestionnaireModal', {
                questions: effectiveQuestionnaire,
                basePrice,
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
                                                {discountResult.originalPrice}
                                            </Text>
                                            <Text style={styles.discountedPriceModal}>
                                                {discountResult.finalPrice}
                                            </Text>
                                            <Text style={styles.creditsText}>{t('classes.credits')}</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.priceValue}>{priceCredits} {t('classes.credits')}</Text>
                                    )}
                                </View>
                                <View style={styles.spotsContainer}>
                                    <Text style={styles.spotsLabel}>{t('classes.availableSpots')}</Text>
                                    <Text style={styles.spotsValue}>
                                        {t('classes.spotsLeft', { count: 1 })}
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
                                                        {booking.status === "pending" && t('classes.currentBooking')}
                                                        {booking.status === "completed" && t('classes.completed')}
                                                        {booking.status === "cancelled_by_consumer" && t('classes.youCancelled')}
                                                        {booking.status === "cancelled_by_business" && t('classes.cancelledByStudio')}
                                                        {booking.status === "cancelled_by_business_rebookable" && t('classes.cancelledByStudio')}
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
                                                    {booking.cancelReason && (
                                                        <Text style={styles.bookingHistoryReason}>
                                                            {booking.cancelReason}
                                                        </Text>
                                                    )}
                                                </View>
                                                <Text style={styles.bookingHistoryCredits}>
                                                    {booking.finalPrice / 100} credits
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                        </View>
                        {/* Bottom padding to account for sticky button */}
                        <View style={styles.bottomPadding} />
                    </ScrollView>

                    {/* Sticky Button - Book or Already Attending */}
                    <View style={[styles.stickyButtonContainer, { bottom: bottomInset + 24 }]}>
                        {existingBooking ? (
                            existingBooking.status === "pending" || existingBooking.status === "completed" ? (
                                /* Already Attending Container */
                                <View style={styles.alreadyAttendingContainer}>
                                    <BlurView intensity={20} style={[StyleSheet.absoluteFill, styles.blurContainer]} />
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
                                        <BlurView intensity={20} style={[StyleSheet.absoluteFill, styles.blurContainer]} />
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
                                        <BlurView intensity={20} style={[StyleSheet.absoluteFill, styles.blurContainer]} />
                                        <View style={styles.statusTitleContainer}>
                                            {existingBooking.status === "cancelled_by_business" && <Text style={styles.statusTitle}>{t('classes.cancelledByStudio')}</Text>}
                                            {existingBooking.status === "no_show" && <Text style={styles.statusTitle}>{t('classes.noShow')}</Text>}
                                        </View>
                                        <Text style={styles.statusSubtext}>
                                            {existingBooking.status === "no_show"
                                                ? t('classes.didntShowUp')
                                                : t('classes.cannotBookAgain')
                                            }
                                        </Text>
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
                                                    <DiamondIcon size={14} color="rgba(255, 255, 255, 0.7)" />
                                                    <Text style={styles.bookButtonOriginalText}>{discountResult.originalPrice}</Text>
                                                </View>
                                                <View style={styles.bookButtonFinalPrice}>
                                                    <DiamondIcon size={18} color="rgba(255, 255, 255, 0.9)" />
                                                    <Text style={styles.bookButtonSubtext}>{discountResult.finalPrice}</Text>
                                                </View>
                                            </View>
                                        ) : (
                                            <>
                                                <DiamondIcon size={18} color="rgba(255, 255, 255, 0.9)" />
                                                <Text style={styles.bookButtonSubtext}>{priceCredits}</Text>
                                            </>
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
        paddingBottom: 100,
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
    blurContainer: {
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
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
        backgroundColor: 'transparent',
        borderRadius: 30,

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
        backgroundColor: 'transparent',
        borderRadius: 40,
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
    statusTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#7c2d12',
    },
    statusSubtext: {
        fontSize: 13,
        fontWeight: '500',
        color: '#92400e',
        textAlign: 'center',
        marginTop: 2,
    },
    rebookContainer: {
        backgroundColor: 'transparent',
        borderRadius: 40,
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
    bookingHistoryCredits: {
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
    creditsText: {
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
});
