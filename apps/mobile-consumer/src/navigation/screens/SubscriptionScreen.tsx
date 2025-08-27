import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CrownIcon } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../theme';
import { SettingsHeader, SettingsGroup } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { useAuthenticatedUser } from '../../stores/auth-store';
import { useQuery, useAction } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { calculateSubscriptionPricing } from '@repo/api/operations/payments';

// Simple currency formatter - can be made configurable later
const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

type SubscriptionTier = {
    credits: number;
    price: number;
    pricePerCredit: number;
    discount: number;
};

// Generate subscription options using backend pricing logic (5-150 credits)
const generateSubscriptionOptions = (): SubscriptionTier[] => {
    const options: SubscriptionTier[] = [];

    // Generate options every 5 credits from 20 to 500
    for (let credits = 20; credits <= 500; credits += 5) {
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
    const [selectedCredits, setSelectedCredits] = useState<number>(20);

    // Get current subscription status
    const subscription = useQuery(api.queries.subscriptions.getCurrentUserSubscription);
    // Use the new dynamic subscription action for full 5-150 credit range
    const createDynamicCheckout = useAction(api.actions.payments.createDynamicSubscriptionCheckout);
    const updateSubscription = useAction(api.actions.payments.updateSubscription);
    const cancelSubscription = useAction(api.actions.payments.cancelSubscription);
    const reactivateSubscription = useAction(api.actions.payments.reactivateSubscription);

    // Initialize slider to current subscription credit amount when subscription loads
    useEffect(() => {
        if (subscription?.creditAmount) {
            // Check if the current subscription credit amount is in our options
            const validOption = subscriptionOptions.find(option => option.credits === subscription.creditAmount);
            if (validOption) {
                setSelectedCredits(subscription.creditAmount);
            }
        }
    }, [subscription?.creditAmount]);

    const handleSliderChange = (value: number) => {
        // Convert slider value (0-1) to index in subscriptionOptions array
        const index = Math.round(value * (subscriptionOptions.length - 1));
        setSelectedCredits(subscriptionOptions[index].credits);
    };

    const getSliderValue = (credits: number) => {
        // Convert credits to slider value (0-1) based on position in subscriptionOptions array
        const index = subscriptionOptions.findIndex(option => option.credits === credits);
        return index >= 0 ? index / (subscriptionOptions.length - 1) : 0;
    };

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
            <StackScreenHeader />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.screenTitle}>Monthly Subscription</Text>
                    <Text style={styles.screenSubtitle}>
                        {isSubscriptionActive()
                            ? 'Manage your current subscription'
                            : 'Get access to unlimited classes with credits every month'
                        }
                    </Text>
                </View>

                {/* Current Subscription Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <CrownIcon size={20} color={theme.colors.emerald[600]} />
                        <Text style={styles.statusTitle}>
                            {isSubscriptionActive() ? 'Active Plan' : 'No Active Plan'}
                        </Text>
                    </View>
                    <Text style={styles.statusDescription}>
                        {isSubscriptionActive()
                            ? `${subscription?.creditAmount} credits/month • Next billing: ${getNextBillingDate()}`
                            : 'Choose a plan to get started with your fitness journey'
                        }
                    </Text>
                    {isSubscriptionCanceling() && (
                        <Text style={styles.cancelingText}>
                            ⚠️ Subscription will end on {getNextBillingDate()}
                        </Text>
                    )}
                </View>

                {/* Plan Selection Card */}
                <View style={styles.planCard}>
                    <View style={styles.planHeader}>
                        <Text style={styles.planTitle}>Choose Your Plan</Text>
                        <Text style={styles.planSubtitle}>Adjust the slider to find the perfect fit</Text>
                    </View>

                    {/* Selection Display */}
                    <View style={styles.selectionDisplay}>
                        {/* Discount Badge */}
                        {getCurrentOption().discount > 0 && (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>
                                    {getCurrentOption().discount}% off
                                </Text>
                            </View>
                        )}

                        <Text style={styles.selectionCredits}>{selectedCredits}</Text>
                        <Text style={styles.selectionLabel}>credits per month</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.selectionPrice}>{formatCurrency(getCurrentOption().price)}</Text>
                            <Text style={styles.priceUnit}>/month</Text>
                        </View>
                        <Text style={styles.pricePerCredit}>{formatCurrency(getCurrentOption().pricePerCredit)} per credit</Text>
                    </View>

                    {/* Slider Section */}
                    <View style={styles.sliderSection}>
                        <View style={styles.sliderLabels}>
                            <Text style={styles.sliderLabelText}>20</Text>
                            <Text style={styles.sliderLabelText}>500</Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            value={getSliderValue(selectedCredits)}
                            onValueChange={handleSliderChange}
                            minimumValue={0}
                            maximumValue={1}
                            step={1 / (subscriptionOptions.length - 1)}
                            minimumTrackTintColor={theme.colors.emerald[500]}
                            maximumTrackTintColor={theme.colors.zinc[200]}
                            thumbTintColor={theme.colors.emerald[600]}
                        />
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

                                {isSubscriptionActive() && (
                                    <TouchableOpacity
                                        style={styles.secondaryButton}
                                        onPress={handleCancelSubscription}
                                    >
                                        <Text style={styles.secondaryButtonText}>
                                            Cancel Subscription
                                        </Text>
                                    </TouchableOpacity>
                                )}
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
    screenTitle: {
        fontSize: theme.fontSize['2xl'],
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.zinc[900],
        marginBottom: theme.spacing.xs,
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.zinc[100],
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

    // Slider Section
    sliderSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    sliderLabelText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.zinc[500],
        fontWeight: theme.fontWeight.medium,
    },
    slider: {
        width: '100%',
        height: 40,
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
