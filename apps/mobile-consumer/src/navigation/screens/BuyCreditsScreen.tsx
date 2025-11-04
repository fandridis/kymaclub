import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { DiamondIcon } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsGroup, SettingsRow, SettingsHeader } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { useAuthenticatedUser } from '../../stores/auth-store';
import { useQuery, useAction } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { CREDIT_PACKS } from '@repo/api/operations/payments';
import { useTypedTranslation } from '../../i18n/typed';

// Simple currency formatter - can be made configurable later
const formatCurrency = (amount: number) => `${amount.toFixed(2)}€`;

export function BuyCreditsScreen() {
    const { t } = useTypedTranslation();
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
            t('purchaseCredits'),
            t('purchaseConfirm', { credits, price: formatCurrency(pack.price) }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('purchase'),
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
                            Alert.alert(t('errors.error'), t('errorPurchase'));
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title={t('credits.buyCredits')} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.screenSubtitle}>
                        {t('purchaseDescription')}
                    </Text>
                </View>

                {/* Current Balance Card */}
                <View style={styles.balanceCard}>
                    <View style={styles.balanceHeader}>
                        <DiamondIcon size={20} color={theme.colors.emerald[600]} />
                        <Text style={styles.balanceTitle}>{t('currentBalance')}</Text>
                    </View>
                    <View style={styles.balanceDisplay}>
                        <Text style={styles.balanceCredits}>{creditBalance?.balance || 0}</Text>
                        <Text style={styles.balanceLabel}>{t('creditsAvailable')}</Text>
                    </View>
                </View>

                {/* Credit Packs Section */}
                <View style={styles.packsSection}>
                    <Text style={styles.packsTitle}>{t('availableCreditPacks')}</Text>
                    <Text style={styles.packsSubtitle}>{t('choosePackMessage')}</Text>

                    <View style={styles.creditPacksGrid}>
                        {CREDIT_PACKS.map((pack) => {
                            const pricePerCredit = pack.price / pack.credits;
                            return (
                                <TouchableOpacity
                                    key={pack.credits}
                                    style={styles.creditPackCard}
                                    onPress={() => handleCreditPurchase(pack.credits)}
                                >
                                    {pack.discount && (
                                        <View style={styles.discountBadge}>
                                            <Text style={styles.discountText}>{t('credits.savePercent', { discount: pack.discount })}</Text>
                                        </View>
                                    )}

                                    <Text style={styles.creditPackCredits}>
                                        {pack.credits}
                                    </Text>
                                    <Text style={styles.creditPackCreditsLabel}>{t('credits.title')}</Text>
                                    <Text style={styles.creditPackPrice}>
                                        {formatCurrency(pack.price)}
                                    </Text>
                                    <Text style={styles.pricePerCredit}>
                                        {formatCurrency(pricePerCredit)} {t('perCredit')}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Credit Information</Text>
                    <Text style={styles.infoText}>
                        • Credits are valid for 90 days from purchase date{'\n'}
                        • Use credits to book classes at any partner studio{'\n'}
                        • If attending many classes, consider a subscription
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

    // Balance Card
    balanceCard: {
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
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    balanceTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
        marginLeft: theme.spacing.sm,
    },
    balanceDisplay: {
        alignItems: 'center',
    },
    balanceCredits: {
        fontSize: theme.fontSize['4xl'],
        fontWeight: theme.fontWeight.extrabold,
        color: theme.colors.emerald[600],
        marginBottom: theme.spacing.xs,
    },
    balanceLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[600],
        fontWeight: theme.fontWeight.medium,
    },

    // Packs Section
    packsSection: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    packsTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
        marginBottom: theme.spacing.xs,
    },
    packsSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[600],
        marginBottom: theme.spacing.lg,
    },
    creditPacksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    creditPackCard: {
        width: '47%',
        backgroundColor: '#fff',
        padding: theme.spacing.lg,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.zinc[100],
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    creditPackCredits: {
        fontSize: theme.fontSize['3xl'],
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.zinc[950],
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    creditPackCreditsLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[500],
        marginBottom: theme.spacing.md,
        textAlign: 'center',
        fontWeight: theme.fontWeight.medium,
    },
    creditPackPrice: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.zinc[800],
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    pricePerCredit: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.emerald[600],
        textAlign: 'center',
        fontWeight: theme.fontWeight.medium,
    },
    discountBadge: {
        position: 'absolute',
        top: theme.spacing.xs,
        right: theme.spacing.xs,
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

    // Info Section
    infoSection: {
        marginHorizontal: theme.spacing.md,
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
