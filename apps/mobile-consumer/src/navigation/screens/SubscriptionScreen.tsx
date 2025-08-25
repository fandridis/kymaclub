import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CrownIcon } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../theme';
import { SettingsHeader, SettingsGroup } from '../../components/Settings';
import { useAuthenticatedUser } from '../../stores/auth-store';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';

type SubscriptionTier = {
    credits: number;
    price: number;
    pricePerCredit: number;
    discount: number;
};

// Static subscription options with correct pricing tiers
const subscriptionOptions: SubscriptionTier[] = [
    // 5 to 40 credits: $2.00 per credit
    { credits: 5, price: 10.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 10, price: 20.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 15, price: 30.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 20, price: 40.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 25, price: 50.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 30, price: 60.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 35, price: 70.00, pricePerCredit: 2.00, discount: 0 },
    { credits: 40, price: 80.00, pricePerCredit: 2.00, discount: 0 },

    // 45 to 80 credits: $1.95 per credit (2.5% discount)
    { credits: 45, price: 87.75, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 50, price: 97.50, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 55, price: 107.25, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 60, price: 117.00, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 65, price: 126.75, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 70, price: 136.50, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 75, price: 146.25, pricePerCredit: 1.95, discount: 2.5 },
    { credits: 80, price: 156.00, pricePerCredit: 1.95, discount: 2.5 },

    // 85 to 120 credits: $1.90 per credit (5% discount)
    { credits: 85, price: 161.50, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 90, price: 171.00, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 95, price: 180.50, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 100, price: 190.00, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 105, price: 199.50, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 110, price: 209.00, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 115, price: 218.50, pricePerCredit: 1.90, discount: 5.0 },
    { credits: 120, price: 228.00, pricePerCredit: 1.90, discount: 5.0 },

    // 125 to 150 credits: $1.80 per credit (10% discount)
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
    const [selectedSubscription, setSelectedSubscription] = useState<number>(20);

    // Mock current subscription status
    const currentSubscription = {
        isActive: true,
        credits: 20,
        nextBilling: '2025-09-25'
    };

    const handleSliderChange = (value: number) => {
        // Convert slider value (0-1) to index in subscriptionOptions array
        const index = Math.round(value * (subscriptionOptions.length - 1));
        setSelectedSubscription(subscriptionOptions[index].credits);
    };

    const getSliderValue = (credits: number) => {
        // Convert credits to slider value (0-1) based on position in subscriptionOptions array
        const index = subscriptionOptions.findIndex(option => option.credits === credits);
        return index >= 0 ? index / (subscriptionOptions.length - 1) : 0;
    };

    const getCurrentOption = () => {
        return subscriptionOptions.find(option => option.credits === selectedSubscription) || subscriptionOptions[3]; // Default to 20 credits
    };

    const handleSubscriptionChange = () => {
        if (selectedSubscription) {
            Alert.alert(
                'Update Subscription',
                `Change your subscription to ${selectedSubscription} credits/month?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Confirm',
                        onPress: () => {
                            // TODO: Implement subscription update
                            console.log('Update subscription to:', selectedSubscription);
                            Alert.alert('Success', 'Subscription updated successfully!');
                        }
                    }
                ]
            );
        }
    };

    const handleCancelSubscription = () => {
        Alert.alert(
            'Cancel Subscription',
            'Are you sure you want to cancel your subscription? You will lose access to your monthly credits.',
            [
                { text: 'Keep Subscription', style: 'cancel' },
                {
                    text: 'Cancel Subscription',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implement subscription cancellation
                        console.log('Cancel subscription');
                        Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled successfully.');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Subscription Section */}
                <SettingsHeader title="Monthly Subscription" />
                <SettingsGroup>
                    <View style={styles.subscriptionHeader}>
                        <View style={styles.subscriptionInfo}>
                            <View style={styles.titleRow}>
                                <CrownIcon size={20} color={theme.colors.emerald[600]} />
                                <Text style={styles.subscriptionTitle}>
                                    {currentSubscription.isActive
                                        ? `${currentSubscription.credits} credits / month`
                                        : 'Monthly subscription'
                                    }
                                </Text>
                            </View>
                            <Text style={styles.nextBilling}>
                                {currentSubscription.isActive
                                    ? `Next billing: ${currentSubscription.nextBilling}`
                                    : 'Inactive subscription'
                                }
                            </Text>
                        </View>
                    </View>
                </SettingsGroup>

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

                        <Text style={styles.selectionCredits}>{selectedSubscription}</Text>
                        <Text style={styles.selectionLabel}>credits/month</Text>
                        <Text style={styles.selectionPrice}>${Math.round(getCurrentOption().price)}/month</Text>
                        <Text style={styles.pricePerCredit}>${getCurrentOption().pricePerCredit?.toFixed(2)} per credit</Text>
                    </View>

                    {/* Native Slider */}
                    <View style={styles.sliderWrapper}>
                        <Slider
                            style={styles.slider}
                            value={getSliderValue(selectedSubscription)}
                            onValueChange={handleSliderChange}
                            minimumValue={0}
                            maximumValue={1}
                            step={1 / (subscriptionOptions.length - 1)} // 32 steps (5, 10, 15, ..., 150)
                            minimumTrackTintColor={theme.colors.emerald[500]}
                            maximumTrackTintColor={theme.colors.zinc[300]}
                            thumbTintColor={theme.colors.emerald[600]}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.updateButton,
                            selectedSubscription === currentSubscription.credits && styles.updateButtonDisabled
                        ]}
                        onPress={handleSubscriptionChange}
                        disabled={selectedSubscription === currentSubscription.credits}
                    >
                        <Text style={[
                            styles.updateButtonText,
                            selectedSubscription === currentSubscription.credits && styles.updateButtonTextDisabled
                        ]}>
                            {currentSubscription.isActive ? 'Update Subscription' : 'Start Subscription'}
                        </Text>
                    </TouchableOpacity>

                    {currentSubscription.isActive && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancelSubscription}
                        >
                            <Text style={styles.cancelButtonText}>
                                Cancel Subscription
                            </Text>
                        </TouchableOpacity>
                    )}
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
        paddingBottom: 60,
    },
    subscriptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    subscriptionInfo: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    subscriptionTitle: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.zinc[900],
        marginLeft: 8,
    },
    nextBilling: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[600],
        marginLeft: 28,
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
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.rose[500],
        marginHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    cancelButtonText: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.rose[500],
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: theme.colors.emerald[100],
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.emerald[300],
    },
    discountText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.emerald[700],
    },
});
