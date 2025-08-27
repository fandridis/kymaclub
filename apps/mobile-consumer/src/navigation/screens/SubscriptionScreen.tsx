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

type SubscriptionTier = {
    credits: number;
    price: number;
    pricePerCredit: number;
    discount: number;
};

// Static subscription options with correct pricing tiers (5-150 credits)
const subscriptionOptions: SubscriptionTier[] = [
    // 5 to 40 credits: €2.00 per credit
    { credits: 5, price: 10.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 10, price: 20.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 15, price: 30.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 20, price: 40.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 25, price: 50.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 30, price: 60.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 35, price: 70.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 40, price: 80.00, pricePerCredit: 2.00, discount: 0 },

    // 45 to 80 credits: €1.95 per credit (2.5% discount)
    { credits: 45, price: 87.75, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 50, price: 97.50, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 55, price: 107.25, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 60, price: 117.00, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 65, price: 126.75, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 70, price: 136.50, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 75, price: 146.25, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 80, price: 156.00, pricePerCredit: 1.95, discount: 2.5 },

    // 85 to 120 credits: €1.90 per credit (5% discount)
    { credits: 85, price: 161.50, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 90, price: 171.00, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 95, price: 180.50, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 100, price: 190.00, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 105, price: 199.50, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 110, price: 209.00, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 115, price: 218.50, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 120, price: 228.00, pricePerCredit: 1.90, discount: 5.0 },

    // 125 to 150 credits: €1.80 per credit (10% discount)
    { credits: 125, price: 225.00, pricePerCredit: 1.80, discount: 10.0 },
    { credits: 130, price: 234.00, pricePerCredit: 1.80, discount: 10.0 },
    { credits: 135, price: 243.00, pricePerCredit: 1.80, discount: 10.0 },
    { credits: 140, price: 252.00, pricePerCredit: 1.80, discount: 10.0 },
    { credits: 145, price: 261.00, pricePerCredit: 1.80, discount: 10.0 },
    { credits: 150, price: 270.00, pricePerCredit: 1.80, discount: 10.0 },
];

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
                    ? `Update to ${selectedCredits} credits/month for €${getCurrentOption().price.toFixed(2)}/month?\n\nChanges will take effect on ${nextBillingDate}. No charge now.`
                    : `Start subscription with ${selectedCredits} credits/month for €${getCurrentOption().price.toFixed(2)}/month?\n\nYou'll be charged now and receive ${selectedCredits} credits immediately.`,
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
            message = `Start new subscription with ${selectedCredits} credits/month for €${currentOption.price.toFixed(2)}/month?`;
            chargeInfo = `\n\nYou'll be charged €${currentOption.price.toFixed(2)} now and receive ${selectedCredits} credits immediately.`;
            buttonText = 'Start & Pay';
        } else {
            // Not expired - just re-enable, no charge
            message = `Re-enable subscription with ${selectedCredits} credits/month?`;
            chargeInfo = `\n\nNo charge now. Your subscription will continue and charge €${currentOption.price.toFixed(2)} on ${nextBillingDate}.`;
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
                {/* Current Subscription Status */}
                <View style={styles.subscriptionCard}>
                    <View style={styles.subscriptionRow}>
                        <View style={styles.subscriptionInfo}>
                            <Text style={styles.subscriptionTitle}>Monthly Subscription</Text>
                            <Text style={styles.subscriptionSubtitle}>
                                {isSubscriptionActive()
                                    ? `${subscription?.creditAmount} credits/month • Next billing: ${getNextBillingDate()}`
                                    : 'Choose a plan to get started'
                                }
                            </Text>
                            {isSubscriptionCanceling() && (
                                <Text style={styles.cancelingText}>
                                    Subscription will end on {getNextBillingDate()}
                                </Text>
                            )}
                        </View>
                        <View style={styles.subscriptionBadge}>
                            <CrownIcon size={16} color={theme.colors.emerald[950]} />
                            <Text style={styles.subscriptionBadgeText}>
                                {isSubscriptionActive() ? 'ACTIVE' : 'INACTIVE'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sliderContainer}>
                    {/* Current Selection Display */}
                    <View style={styles.selectionDisplay}>
                        {/* Discount Badge */}
                        {getCurrentOption().discount > 0 && (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>
                                    {getCurrentOption().discount}% discount
                                </Text>
                            </View>
                        )}

                        <Text style={styles.selectionCredits}>{selectedCredits}</Text>
                        <Text style={styles.selectionLabel}>credits/month</Text>
                        <Text style={styles.selectionPrice}>€{getCurrentOption().price.toFixed(2)}/month</Text>
                        <Text style={styles.pricePerCredit}>€{getCurrentOption().pricePerCredit?.toFixed(2)} per credit</Text>
                    </View>

                    {/* Native Slider */}
                    <View style={styles.sliderWrapper}>
                        <Slider
                            style={styles.slider}
                            value={getSliderValue(selectedCredits)}
                            onValueChange={handleSliderChange}
                            minimumValue={0}
                            maximumValue={1}
                            step={1 / (subscriptionOptions.length - 1)}
                            minimumTrackTintColor={theme.colors.emerald[500]}
                            maximumTrackTintColor={theme.colors.zinc[300]}
                            thumbTintColor={theme.colors.emerald[600]}
                        />
                    </View>

                    {/* Show different buttons based on subscription state */}
                    {isSubscriptionCanceling() ? (
                        // When subscription is cancelled/canceling, only show Reactivate button
                        <TouchableOpacity
                            style={styles.reactivateButton}
                            onPress={handleReactivateSubscription}
                        >
                            <Text style={styles.reactivateButtonText}>
                                Reactivate Subscription
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        // When subscription is active or doesn't exist, show Update/Start button
                        <>
                            <TouchableOpacity
                                style={[
                                    styles.updateButton,
                                    isSubscriptionActive() && selectedCredits === (subscription?.creditAmount ?? 0) && styles.updateButtonDisabled
                                ]}
                                onPress={handleSubscriptionChange}
                                disabled={isSubscriptionActive() && selectedCredits === (subscription?.creditAmount ?? 0)}
                            >
                                <Text style={[
                                    styles.updateButtonText,
                                    isSubscriptionActive() && selectedCredits === (subscription?.creditAmount ?? 0) && styles.updateButtonTextDisabled
                                ]}>
                                    {isSubscriptionActive() ? 'Update Subscription' : 'Start Subscription'}
                                </Text>
                            </TouchableOpacity>

                            {/* Only show cancel button if subscription is active and not canceling */}
                            {isSubscriptionActive() && (
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={handleCancelSubscription}
                                >
                                    <Text style={styles.cancelButtonText}>
                                        Cancel Subscription
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 60,
    },
    // Subscription card styled like credits card
    subscriptionCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: theme.colors.emerald[50],
        borderWidth: 1,
        borderColor: theme.colors.emerald[100],
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    subscriptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subscriptionInfo: {
        flex: 1,
    },
    subscriptionTitle: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.emerald[950],
        marginBottom: 2,
    },
    subscriptionSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.emerald[700],
    },
    subscriptionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.emerald[50],
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    subscriptionBadgeText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.emerald[950],
        marginLeft: 4,
    },
    cancelingText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.amber[600],
        marginTop: 4,
        fontWeight: theme.fontWeight.medium,
    },
    sliderContainer: {
        paddingTop: 0,
        paddingBottom: 12,
    },
    selectionDisplay: {
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 20,
        position: 'relative',
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: theme.colors.rose[50],
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.rose[300],
    },
    discountText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.rose[950],
    },
    selectionCredits: {
        fontSize: theme.fontSize['3xl'],
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.emerald[600],
    },
    selectionLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[600],
        marginBottom: 8,
    },
    selectionPrice: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
    },
    pricePerCredit: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.emerald[600],
        fontWeight: theme.fontWeight.medium,
        marginTop: 4,
    },
    sliderWrapper: {
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    slider: {
        width: '100%',
        height: 40,
        marginBottom: 10,
    },
    updateButton: {
        backgroundColor: theme.colors.emerald[600],
        marginHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    updateButtonText: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: '#fff',
    },
    updateButtonDisabled: {
        backgroundColor: theme.colors.zinc[300],
    },
    updateButtonTextDisabled: {
        color: theme.colors.zinc[500],
    },
    reactivateButton: {
        backgroundColor: theme.colors.emerald[600],
        marginHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    reactivateButtonText: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: '#fff',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.rose[500],
        marginHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    cancelButtonText: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.rose[500],
    },
});
