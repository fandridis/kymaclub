import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { CrownIcon, DiamondIcon } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsHeader, SettingsGroup } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { useAuthenticatedUser } from '../../stores/auth-store';
import { useQuery, useAction } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { calculateSubscriptionPricing } from '@repo/utils/credits';

// Simple currency formatter - can be made configurable later
const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

type SubscriptionTier = {
    credits: number;
    price: number;
    pricePerCredit: number;
    discount: number;
};

// Generate subscription options using backend pricing logic
const generateSubscriptionOptions = (): SubscriptionTier[] => {
    const options: SubscriptionTier[] = [];

    // Generate options every 5 credits from 5 to 500
    for (let credits = 5; credits <= 500; credits += 5) {
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
    const navigation = useNavigation();
    const user = useAuthenticatedUser();
    const [selectedCredits, setSelectedCredits] = useState<number>(25);

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
            const cardOptions = [10, 25, 50, 100, 200, 500];
            if (cardOptions.includes(subscription.creditAmount)) {
                setSelectedCredits(subscription.creditAmount);
            }
        }
    }, [subscription?.creditAmount]);


    const getCurrentOption = () => {
        return subscriptionOptions.find(option => option.credits === selectedCredits) || subscriptionOptions[3]; // Default to 20 credits
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
        if (selectedCredits) {
            const isUpdate = isSubscriptionActive();
            const nextBillingDate = subscription ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

            Alert.alert(
                isUpdate ? 'Update Subscription' : 'Start Subscription',
                isUpdate
                    ? `Update to ${selectedCredits} credits/month for ${formatCurrency(getCurrentOption().price)}/month?\n\nChanges will take effect on ${nextBillingDate}. No charge now.`
                    : `Start subscription with ${selectedCredits} credits/month for ${formatCurrency(getCurrentOption().price)}/month?\n\nYou'll be charged now and receive ${selectedCredits} credits immediately.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: isUpdate ? 'Update' : 'Start & Pay',
                        onPress: async () => {
                            if (isUpdate) {
                                try {
                                    const result = await updateSubscription({ newCreditAmount: selectedCredits });
                                    Alert.alert('Subscription Updated!', result.message);
                                } catch (error) {
                                    console.error('Error updating subscription:', error);
                                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                                    Alert.alert('Error', `Failed to update subscription. ${errorMessage}`);
                                }
                            } else {
                                // For new subscriptions, go directly to checkout
                                try {
                                    const result = await createDynamicCheckout({ creditAmount: selectedCredits });
                                    if (result.checkoutUrl) {
                                        await Linking.openURL(result.checkoutUrl);
                                    }
                                } catch (error) {
                                    console.error('Error creating checkout:', error);
                                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                                    Alert.alert('Error', `Failed to start subscription. ${errorMessage}`);
                                }
                            }
                        }
                    }
                ]
            );
        }
    };

    const handleCancelSubscription = async () => {
        Alert.alert(
            'Cancel Subscription',
            'Are you sure you want to cancel your subscription? You\'ll continue to have access until the end of your current billing period.',
            [
                { text: 'Keep Subscription', style: 'cancel' },
                {
                    text: 'Cancel Subscription',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelSubscription({});
                            Alert.alert('Subscription Cancelled', 'Your subscription will end at the end of your current billing period.');
                        } catch (error) {
                            console.error('Error canceling subscription:', error);
                            Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
                        }
                    }
                }
            ]
        );
    };


    const handleReactivateSubscription = async () => {
        // Check subscription status and what will happen
        const currentOption = getCurrentOption();
        const subscriptionExpired = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() < Date.now() : true;
        const nextBillingDate = subscription ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

        let message: string;
        let chargeInfo: string;
        let buttonText: string;

        if (subscriptionExpired) {
            // Expired - start new subscription with full charge
            message = `Start new subscription with ${selectedCredits} credits/month for ${formatCurrency(currentOption.price)}/month?`;
            chargeInfo = `\n\nYou'll be charged ${formatCurrency(currentOption.price)} now and receive ${selectedCredits} credits immediately.`;
            buttonText = 'Start & Pay';
        } else {
            // Not expired - just re-enable, no charge
            message = `Re-enable subscription with ${selectedCredits} credits/month?`;
            chargeInfo = `\n\nNo charge now. Your subscription will continue and charge ${formatCurrency(currentOption.price)} on ${nextBillingDate}.`;
            buttonText = 'Re-enable';
        }

        Alert.alert(
            'Reactivate Subscription',
            `${message}${chargeInfo}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: buttonText,
                    onPress: async () => {
                        try {
                            // Pass the selected credit amount to the reactivation
                            const result = await reactivateSubscription({ newCreditAmount: selectedCredits });
                            Alert.alert('Subscription Reactivated!', result.message);
                        } catch (error) {
                            console.error('Error reactivating subscription:', error);
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                            Alert.alert('Error', `Failed to reactivate subscription. ${errorMessage}`);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title="Monthly Subscription" />
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
                                            {`${subscription?.creditAmount} credits/month`}
                                        </Text>
                                        <Text style={styles.planSubtitle}>
                                            {`Next billing: ${getNextBillingDate()}`}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={handleCancelSubscription}
                                    >
                                        <Text style={styles.cancelButtonText}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                            : <>
                                <Text style={styles.planTitle}>
                                    {`No active plan`}
                                </Text>
                                <Text style={styles.planSubtitle}>
                                    {`Choose one of the following plans to start your subscription.`}
                                </Text>
                            </>

                        }
                    </View>

                    {/* Credit Selection Cards */}
                    <View style={styles.cardsSection}>
                        <View style={styles.cardsGrid}>
                            {[10, 25, 50, 100, 200, 500].map(credits => {
                                const option = subscriptionOptions.find(opt => opt.credits === credits);
                                if (!option) return null;

                                const isSelected = selectedCredits === credits;

                                return (
                                    <TouchableOpacity
                                        key={credits}
                                        style={[styles.subscriptionCard, isSelected && styles.subscriptionCardSelected]}
                                        onPress={() => setSelectedCredits(credits)}
                                        activeOpacity={0.85}
                                    >
                                        <View style={styles.cardHeader}>
                                            <DiamondIcon size={24} color={theme.colors.emerald[500]} />
                                        </View>

                                        <Text style={styles.cardCredits}>{credits}</Text>
                                        <Text style={styles.cardCreditsSubtext}>credits/month</Text>
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
                                                {option.discount > 0 ? `${option.discount}% off` : 'Full price'}
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
                                style={styles.primaryButton}
                                onPress={handleReactivateSubscription}
                            >
                                <Text style={styles.primaryButtonText}>
                                    Reactivate Subscription
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        isSubscriptionActive() && selectedCredits === (subscription?.creditAmount ?? 0) && styles.primaryButtonDisabled
                                    ]}
                                    onPress={handleSubscriptionChange}
                                    disabled={isSubscriptionActive() && selectedCredits === (subscription?.creditAmount ?? 0)}
                                >
                                    <Text style={[
                                        styles.primaryButtonText,
                                        isSubscriptionActive() && selectedCredits === (subscription?.creditAmount ?? 0) && styles.primaryButtonTextDisabled
                                    ]}>
                                        {isSubscriptionActive() ? 'Update Plan' : 'Start Subscription'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>How it works</Text>
                    <Text style={styles.infoText}>
                        • Credits are added to your account each month{'\n'}
                        • Use credits to book classes at any partner studio{'\n'}
                        • Unused credits roll over for up to 3 months{'\n'}
                        • Cancel anytime - no commitment required
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
        marginHorizontal: theme.spacing.lg,
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
        paddingBottom: theme.spacing.lg,
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
