import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DiamondIcon } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsGroup, SettingsRow, SettingsHeader } from '../../components/Settings';
import { useAuthenticatedUser } from '../../stores/auth-store';
import { useQuery, useAction } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { CREDIT_PACKS, type CreditPack } from '@repo/api/operations/payments';

export function BuyCreditsScreen() {
    const navigation = useNavigation();
    const user = useAuthenticatedUser();

    // Get user credit balance
    const creditBalance = useQuery(api.queries.credits.getUserBalance, { userId: user._id });

    // One-time credit purchase action
    const createOneTimeCheckout = useAction(api.actions.payments.createOneTimeCreditCheckout);

    const handleCreditPurchase = async (credits: number) => {
        const pack = CREDIT_PACKS.find(p => p.credits === credits);
        if (!pack) return;

        Alert.alert(
            'Purchase Credits',
            `Purchase ${credits} credits for $${pack.price.toFixed(0)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Purchase',
                    onPress: async () => {
                        try {
                            const result = await createOneTimeCheckout({
                                creditAmount: credits
                            });

                            if (result.checkoutUrl) {
                                await Linking.openURL(result.checkoutUrl);
                            }
                        } catch (error) {
                            console.error('Error creating checkout:', error);
                            Alert.alert('Error', 'Failed to start purchase. Please try again.');
                        }
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
                {/* Current Balance */}
                <SettingsGroup>
                    <SettingsRow
                        title="Credits Balance"
                        subtitle={(() => {
                            const mockExpiringCredits = 15;
                            const mockDaysUntilExpiry = 12;
                            if (mockDaysUntilExpiry < 30 && mockExpiringCredits > 0) {
                                return `${mockExpiringCredits} credits expire in ${mockDaysUntilExpiry} days`;
                            }
                            return undefined;
                        })()}
                        rightElement={
                            <View style={styles.creditsBadge}>
                                <DiamondIcon size={16} color={theme.colors.emerald[600]} />
                                <Text style={styles.creditsBadgeText}>{creditBalance?.balance || 0}</Text>
                            </View>
                        }
                        showChevron={false}
                    />
                </SettingsGroup>

                {/* Credit Packs Section */}
                <SettingsHeader title="Available Credit Packs" />
                <View style={styles.creditPacksGrid}>
                    {CREDIT_PACKS.map((pack) => {
                        const originalPrice = pack.credits * 2.30;
                        const pricePerCredit = pack.price / pack.credits;
                        return (
                            <TouchableOpacity
                                key={pack.credits}
                                style={styles.creditPackCard}
                                onPress={() => handleCreditPurchase(pack.credits)}
                            >
                                <Text style={styles.creditPackCredits}>
                                    {pack.credits}
                                </Text>
                                <Text style={styles.creditPackCreditsLabel}>credits</Text>
                                <Text style={styles.creditPackPrice}>
                                    ${pack.price.toFixed(2)}
                                </Text>
                                <Text style={styles.pricePerCredit}>
                                    ${pricePerCredit.toFixed(2)} per credit
                                </Text>
                                {pack.discount && (
                                    <View style={styles.discountBadgeTopRight}>
                                        <Text style={styles.discountTextTopRight}>{pack.discount}% OFF</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
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
    creditsHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    creditsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.emerald[50],
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    creditsBadgeText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.emerald[600],
        marginLeft: 4,
    },
    creditPacksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    creditPackCard: {
        width: '47%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    creditPackCredits: {
        fontSize: theme.fontSize['2xl'],
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.zinc[900],
        textAlign: 'center',
    },
    creditPackCreditsLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.zinc[600],
        marginBottom: 8,
        textAlign: 'center',
    },
    creditPackPrice: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.emerald[600],
        textAlign: 'center',
        marginBottom: 4,
    },
    pricePerCredit: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.zinc[500],
        textAlign: 'center',
    },

    discountBadgeTopRight: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.rose[500],
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    discountTextTopRight: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
        color: '#fff',
    },
});
