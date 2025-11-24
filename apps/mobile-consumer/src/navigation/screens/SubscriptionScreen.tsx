import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { CrownIcon, DiamondIcon } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsHeader, SettingsGroup } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useQuery, useAction } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { calculateSubscriptionPricing } from '@repo/utils/credits';
import { useTypedTranslation } from '../../i18n/typed';

// Simple currency formatter - can be made configurable later
const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

type SubscriptionTier = {
    credits: number;
    price: number;
    pricePerCredit: number;
    discount: number;
};

// Generate subscription options using backend pricing logic
// Only generate options for allowed tier amounts
const generateSubscriptionOptions = (): SubscriptionTier[] => {
    const allowedTiers = [20, 30, 50, 70, 100, 200];
    const options: SubscriptionTier[] = [];

    for (const credits of allowedTiers) {
        const pricing = calculateSubscriptionPricing(credits);
        options.push({
            credits: credits,
            price: pricing.priceInCents / 100, // Convert cents to base currency units
            pricePerCredit: pricing.pricePerCredit,
            discount: pricing.discount
        });
    }

    return options;
};

const subscriptionOptions: SubscriptionTier[] = generateSubscriptionOptions();

export function SubscriptionScreen() {
    const { t } = useTypedTranslation();
    const navigation = useNavigation();
    const { user } = useCurrentUser();
    const [selectedCredits, setSelectedCredits] = useState<number>(20);
    const [isLoading, setIsLoading] = useState(false);

    // Get current subscription status
    const subscription = useQuery(api.queries.subscriptions.getCurrentUserSubscription);
    // Use the new dynamic subscription action for full 5-150 credit range
    const createDynamicCheckout = useAction(api.actions.payments.createDynamicSubscriptionCheckout);
    const updateSubscription = useAction(api.actions.payments.updateSubscription);
    const cancelSubscription = useAction(api.actions.payments.cancelSubscription);
    const reactivateSubscription = useAction(api.actions.payments.reactivateSubscription);

    // Initialize to current subscription credit amount when subscription loads
    useEffect(() => {
        if (subscription?.creditAmount) {
            // Check if the current subscription credit amount is in our card options
            const cardOptions = [20, 30, 50, 70, 100, 200];
            if (cardOptions.includes(subscription.creditAmount)) {
                setSelectedCredits(subscription.creditAmount);
            }
        }
    }, [subscription?.creditAmount]);


    const getCurrentOption = () => {
        return subscriptionOptions.find(option => option.credits === selectedCredits) || subscriptionOptions[0]; // Default to 10 credits
    };

    const isSubscriptionActive = (): boolean => {
        return Boolean(subscription && subscription.status === 'active');
    };

    const isSubscriptionCanceling = () => {
        return subscription && subscription.cancelAtPeriodEnd;
    };

    const getNextBillingDate = () => {
        if (!subscription) return null;
        const date = new Date(subscription.currentPeriodEnd);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleSubscriptionChange = () => {
        if (selectedCredits && !isLoading) {
            const isUpdate = isSubscriptionActive();
            const nextBillingDate = subscription ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

            Alert.alert(
                isUpdate ? t('subscription.updateSubscription') : t('subscription.startSubscription'),
                isUpdate
                    ? t('subscription.updateConfirm', {
                        credits: selectedCredits,
                        price: formatCurrency(getCurrentOption().price),
                        date: nextBillingDate
                    })
                    : t('subscription.startConfirm', {
                        credits: selectedCredits,
                        price: formatCurrency(getCurrentOption().price)
                    }),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: isUpdate ? t('subscription.update') : t('subscription.startAndPay'),
                        onPress: async () => {
                            setIsLoading(true);
                            try {
                                if (isUpdate) {
                                    console.log('[Subscription] Starting subscription update', {
                                        userId: user?._id,
                                        newCreditAmount: selectedCredits,
                                        currentSubscription: subscription?.creditAmount,
                                    });
                                    const result = await updateSubscription({ newCreditAmount: selectedCredits });
                                    console.log('[Subscription] Update result:', result);
                                    Alert.alert(t('subscription.subscriptionUpdated'), result.message);
                                } else {
                                    // For new subscriptions, go directly to checkout
                                    console.log('[Subscription] Starting NEW subscription', {
                                        userId: user?._id,
                                        creditAmount: selectedCredits,
                                        hasExistingSubscription: !!subscription,
                                        existingSubscriptionStatus: subscription?.status,
                                    });
                                    const result = await createDynamicCheckout({ creditAmount: selectedCredits });
                                    console.log('[Subscription] Checkout created:', {
                                        hasCheckoutUrl: !!result.checkoutUrl,
                                        sessionId: result.sessionId,
                                    });
                                    if (result.checkoutUrl) {
                                        console.log('[Subscription] Opening Stripe checkout URL');
                                        await Linking.openURL(result.checkoutUrl);
                                    } else {
                                        console.warn('[Subscription] No checkout URL returned!');
                                    }
                                }
                            } catch (error) {
                                console.error('[Subscription] Error with subscription:', error);
                                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                                Alert.alert(t('errors.error'), isUpdate ? t('subscription.errorUpdate', { message: errorMessage }) : t('subscription.errorStart', { message: errorMessage }));
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    }
                ]
            );
        }
    };

    const handleCancelSubscription = async () => {
        if (isLoading) return;

        Alert.alert(
            t('subscription.cancelSubscription'),
            t('subscription.cancelConfirm'),
            [
                { text: t('subscription.keepSubscription'), style: 'cancel' },
                {
                    text: t('subscription.cancelSubscription'),
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            console.log('Cancelling subscription...');
                            await cancelSubscription({});
                            console.log('Subscription cancelled!');
                            Alert.alert(t('subscription.subscriptionCancelled'), t('subscription.cancelSuccess'));
                        } catch (error) {
                            console.error('Error canceling subscription:', error);
                            Alert.alert(t('errors.error'), t('subscription.errorCancel'));
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };


    const handleReactivateSubscription = async () => {
        if (isLoading) return;

        // Check subscription status and what will happen
        const currentOption = getCurrentOption();
        const subscriptionExpired = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() < Date.now() : true;
        const nextBillingDate = subscription ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

        let message: string;
        let chargeInfo: string;
        let buttonText: string;

        if (subscriptionExpired) {
            // Expired - start new subscription with full charge
            message = t('subscription.reactivateExpiredConfirm', {
                credits: selectedCredits,
                price: formatCurrency(currentOption.price)
            });
            chargeInfo = '';
            buttonText = t('subscription.startAndPay');
        } else {
            // Not expired - just re-enable, no charge
            message = t('subscription.reactivateActiveConfirm', {
                credits: selectedCredits,
                price: formatCurrency(currentOption.price),
                date: nextBillingDate
            });
            chargeInfo = '';
            buttonText = t('subscription.reenable');
        }

        Alert.alert(
            t('subscription.reactivateSubscription'),
            `${message}${chargeInfo}`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: buttonText,
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            // Pass the selected credit amount to the reactivation
                            const result = await reactivateSubscription({ newCreditAmount: selectedCredits });
                            Alert.alert(t('subscription.subscriptionReactivated'), result.message);
                        } catch (error) {
                            console.error('Error reactivating subscription:', error);
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                            Alert.alert(t('errors.error'), t('subscription.errorReactivate', { message: errorMessage }));
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title={t('subscription.monthlySubscription')} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                {/* <View style={styles.headerSection}>
                    <Text style={styles.screenSubtitle}>
                        {isSubscriptionActive()
                            ? 'Manage your current subscription'
                            : 'Get access to unlimited classes with credits every month'
                        }
                    </Text>
                </View> */}


                {/* <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <CrownIcon size={20} color={theme.colors.emerald[600]} />
                        <Text style={styles.statusTitle}>
                            {isSubscriptionActive() ? 'Active Plan' : 'No Active Plan'}
                        </Text>
                    </View>
                    <Text style={styles.statusDescription}>
                        {isSubscriptionActive()
                            ? isSubscriptionCanceling()
                                ? `${subscription?.creditAmount} credits/month`
                                : `${subscription?.creditAmount} credits/month • Next billing: ${getNextBillingDate()}`
                            : 'Choose a plan to get started with your fitness journey'
                        }
                    </Text>
                    {isSubscriptionCanceling() && (
                        <Text style={styles.cancelingText}>
                            ⚠️ Subscription will end on {getNextBillingDate()}
                        </Text>
                    )}
                    {isSubscriptionActive() && !isSubscriptionCanceling() && (
                        <View style={styles.statusActions}>
                            <TouchableOpacity onPress={handleCancelSubscription} accessibilityRole="button">
                                <Text style={styles.inlineButtonText}>Cancel subscripion</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View> */}

                {/* Plan Selection Card */}
                <View style={styles.planCard}>
                    <View style={styles.planHeader}>
                        {!subscription?.cancelAtPeriodEnd && subscription?.status === 'active'
                            ? <>
                                <View style={styles.planContentRow}>
                                    <View style={styles.planTextColumn}>
                                        <Text style={styles.planTitle}>
                                            {t('subscription.creditsPerMonth', { credits: subscription?.creditAmount })}
                                        </Text>
                                        <Text style={styles.planSubtitle}>
                                            {t('subscription.nextBilling', { date: getNextBillingDate() })}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.cancelButton,
                                            isLoading && styles.cancelButtonDisabled
                                        ]}
                                        onPress={handleCancelSubscription}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <View style={styles.buttonContent}>
                                                <ActivityIndicator size="small" color={theme.colors.rose[600]} />
                                                <Text style={[styles.cancelButtonText, styles.buttonTextWithSpinner]}>
                                                    {t('subscription.canceling')}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.cancelButtonText}>
                                                {t('common.cancel')}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                            : <>
                                <Text style={styles.planTitle}>
                                    {t('subscription.noPlan')}
                                </Text>
                                <Text style={styles.planSubtitle}>
                                    {t('subscription.chooseYourPlan')}
                                </Text>
                            </>

                        }
                    </View>

                    {/* Credit Selection Cards */}
                    <View style={styles.cardsSection}>
                        <View style={styles.cardsGrid}>
                            {[20, 30, 50, 70, 100, 200].map(credits => {
                                const option = subscriptionOptions.find(opt => opt.credits === credits);
                                if (!option) return null;

                                const isSelected = selectedCredits === credits;

                                return (
                                    <TouchableOpacity
                                        key={credits}
                                        style={[
                                            styles.subscriptionCard,
                                            isSelected && styles.subscriptionCardSelected,
                                            isLoading && styles.subscriptionCardDisabled
                                        ]}
                                        onPress={() => !isLoading && setSelectedCredits(credits)}
                                        activeOpacity={0.85}
                                        disabled={isLoading}
                                    >
                                        <View style={styles.cardHeader}>
                                            <DiamondIcon size={24} color={theme.colors.emerald[500]} />
                                        </View>

                                        <Text style={styles.cardCredits}>{credits}</Text>
                                        <Text style={styles.cardCreditsSubtext}>{t('subscription.creditsPerMonth', { credits })}</Text>
                                        <Text style={styles.cardPrice}>{formatCurrency(option.price)}</Text>

                                        <View
                                            style={[
                                                styles.badge,
                                                option.discount > 0 ? styles.badgeDiscount : styles.badgeNeutral,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.badgeText,
                                                    option.discount > 0 ? styles.badgeTextDiscount : styles.badgeTextNeutral,
                                                ]}
                                            >
                                                {option.discount > 0 ? t('subscription.savePercent', { discount: option.discount }) : t('subscription.standardRate')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionSection}>
                        {isSubscriptionCanceling() ? (
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    isLoading && styles.primaryButtonDisabled
                                ]}
                                onPress={handleReactivateSubscription}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <View style={styles.buttonContent}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={[styles.primaryButtonText, styles.buttonTextWithSpinner]}>
                                            {t('subscription.starting')}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.primaryButtonText}>
                                        {t('subscription.reactivateSubscription')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        (isSubscriptionActive() && selectedCredits === (subscription?.creditAmount ?? 0)) || isLoading ? styles.primaryButtonDisabled : null
                                    ]}
                                    onPress={handleSubscriptionChange}
                                    disabled={(isSubscriptionActive() && selectedCredits === (subscription?.creditAmount ?? 0)) || isLoading}
                                >
                                    {isLoading ? (
                                        <View style={styles.buttonContent}>
                                            <ActivityIndicator size="small" color="#fff" />
                                            <Text style={[styles.primaryButtonText, styles.buttonTextWithSpinner]}>
                                                {isSubscriptionActive() ? t('subscription.updating') : t('subscription.starting')}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text style={[
                                            styles.primaryButtonText,
                                            isSubscriptionActive() && selectedCredits === (subscription?.creditAmount ?? 0) && styles.primaryButtonTextDisabled
                                        ]}>
                                            {isSubscriptionActive() ? t('subscription.updatePlan') : t('subscription.startSubscription')}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>{t('subscription.whySubscribe')}</Text>
                    <Text style={styles.infoText}>
                        {t('subscription.benefits')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: theme.spacing['2xl'],
    },

    // Header Section
    headerSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
    },
    screenSubtitle: {
        fontSize: theme.fontSize.base,
        color: theme.colors.zinc[600],
        lineHeight: theme.fontSize.base * 1.4,
    },

    // Status Card
    statusCard: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.zinc[100],
        padding: theme.spacing.lg,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    statusTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
        marginLeft: theme.spacing.sm,
    },
    statusDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[600],
        lineHeight: theme.fontSize.sm * 1.4,
    },
    cancelingText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.amber[600],
        marginTop: theme.spacing.xs,
        fontWeight: theme.fontWeight.medium,
    },
    statusActions: {
        marginTop: theme.spacing.sm,
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    inlineButtonText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.rose[500],
        fontWeight: theme.fontWeight.medium,
    },

    // Plan Card
    planCard: {
        marginHorizontal: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.zinc[100],
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    planHeader: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
    },
    planContentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    planTextColumn: {
        flex: 1,
    },
    planTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
        marginBottom: theme.spacing.xs,
    },
    planSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[600],
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.rose[300],
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: 8,
    },
    cancelButtonText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.rose[600],
    },
    cancelButtonDisabled: {
        opacity: 0.6,
    },

    // Selection Display
    selectionDisplay: {
        alignItems: 'center',
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        position: 'relative',
    },
    discountBadge: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        backgroundColor: theme.colors.emerald[50],
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.emerald[200],
    },
    discountText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.emerald[700],
    },
    selectionCredits: {
        fontSize: theme.fontSize['4xl'],
        fontWeight: theme.fontWeight.extrabold,
        color: theme.colors.emerald[600],
        marginBottom: theme.spacing.xs,
    },
    selectionLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[600],
        marginBottom: theme.spacing.md,
        fontWeight: theme.fontWeight.medium,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: theme.spacing.xs,
    },
    selectionPrice: {
        fontSize: theme.fontSize['2xl'],
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.zinc[900],
    },
    priceUnit: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.zinc[600],
        marginLeft: 2,
    },
    pricePerCredit: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.emerald[600],
        fontWeight: theme.fontWeight.medium,
    },

    // Cards Section
    cardsSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    subscriptionCard: {
        width: '48%',
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        minHeight: 160,
        marginBottom: theme.spacing.md,
    },
    subscriptionCardSelected: {
        borderColor: theme.colors.emerald[500],
        shadowOpacity: 0.12,
    },
    subscriptionCardDisabled: {
        opacity: 0.5,
    },
    cardHeader: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    cardCredits: {
        fontSize: theme.fontSize['2xl'],
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.zinc[900],
        textAlign: 'center',
        marginBottom: 2,
    },
    cardCreditsSubtext: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.zinc[500],
        textAlign: 'center',
        marginBottom: 8,
    },
    cardPrice: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.zinc[500],
        textAlign: 'center',
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    badgeDiscount: {
        backgroundColor: theme.colors.emerald[50],
        borderColor: theme.colors.emerald[200],
    },
    badgeNeutral: {
        backgroundColor: theme.colors.zinc[100],
        borderColor: theme.colors.zinc[200],
    },
    badgeText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.semibold,
    },
    badgeTextDiscount: {
        color: theme.colors.emerald[700],
    },
    badgeTextNeutral: {
        color: theme.colors.zinc[600],
    },

    // Action Section
    actionSection: {
        padding: theme.spacing.lg,
        paddingTop: 0,
        gap: theme.spacing.md,
    },
    primaryButton: {
        backgroundColor: theme.colors.emerald[600],
        paddingVertical: theme.spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    primaryButtonText: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: '#fff',
    },
    primaryButtonDisabled: {
        backgroundColor: theme.colors.zinc[300],
    },
    primaryButtonTextDisabled: {
        color: theme.colors.zinc[500],
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    buttonTextWithSpinner: {
        marginLeft: theme.spacing.xs,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.rose[300],
        paddingVertical: theme.spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    secondaryButtonText: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.rose[600],
    },

    // Info Section
    infoSection: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.zinc[50],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.zinc[100],
    },
    infoTitle: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
        marginBottom: theme.spacing.md,
    },
    infoText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[600],
        lineHeight: theme.fontSize.sm * 1.5,
    },
});
