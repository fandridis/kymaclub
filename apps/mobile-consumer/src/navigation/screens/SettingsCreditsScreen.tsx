import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DiamondIcon, CrownIcon, CheckIcon } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsHeader, SettingsGroup } from '../../components/Settings';
import { useAuthenticatedUser } from '../../stores/auth-store';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';

type SubscriptionTier = {
  credits: number;
  price: number;
};

type CreditPack = {
  credits: number;
  price: number;
  bonus?: number;
};

const subscriptionTiers: SubscriptionTier[] = [
  { credits: 10, price: 19.45 },
  { credits: 20, price: 34.99 },
  { credits: 30, price: 49.99 },
  { credits: 40, price: 59.99 },
];

const creditPacks: CreditPack[] = [
  { credits: 5, price: 12.5 },
  { credits: 10, price: 25.0 },
  { credits: 20, price: 50.0 },
  { credits: 30, price: 75.0, bonus: 2 },
  { credits: 40, price: 100.0, bonus: 3 },
  { credits: 50, price: 125.0, bonus: 5 },
];

export function SettingsCreditsScreen() {
  const navigation = useNavigation();
  const user = useAuthenticatedUser();
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(20);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);

  // Get user credit balance
  const creditBalance = useQuery(api.queries.credits.getUserBalance, { userId: user._id });

  // Mock current subscription status
  const currentSubscription = {
    isActive: true,
    credits: 20,
    nextBilling: '2025-09-25'
  };

  const handleSubscriptionSelect = (credits: number) => {
    setSelectedSubscription(credits);
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

  const handleCreditPurchase = (credits: number) => {
    Alert.alert(
      'Purchase Credits',
      `Purchase ${credits} credits?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            // TODO: Implement credit purchase
            console.log('Purchase credits:', credits);
            Alert.alert('Success', `${credits} credits purchased successfully!`);
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
        <View style={styles.balanceSection}>
          <Text style={styles.balanceTitle}>Current Balance</Text>
          <View style={styles.balanceDisplay}>
            <DiamondIcon size={32} color={theme.colors.emerald[600]} />
            <Text style={styles.balanceAmount}>{creditBalance?.balance || 0}</Text>
          </View>
          {/* Mock data - in real app this would come from creditBalance query */}
          {(() => {
            const mockExpiringCredits = 15;
            const mockDaysUntilExpiry = 12;
            if (mockDaysUntilExpiry < 30 && mockExpiringCredits > 0) {
              return (
                <Text style={styles.expirationWarning}>
                  {mockExpiringCredits} credits expire in {mockDaysUntilExpiry} days
                </Text>
              );
            }
            return null;
          })()}
        </View>

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
                    : 'Inactive subscription'}
                </Text>
              </View>
              {currentSubscription.isActive && (
                <Text style={styles.nextBilling}>
                  Next billing: {currentSubscription.nextBilling}
                </Text>
              )}
            </View>
            <Switch
              value={subscriptionEnabled}
              onValueChange={setSubscriptionEnabled}
              trackColor={{ false: theme.colors.zinc[300], true: theme.colors.emerald[300] }}
              thumbColor={subscriptionEnabled ? theme.colors.emerald[600] : theme.colors.zinc[500]}
            />
          </View>
        </SettingsGroup>

        {subscriptionEnabled && (
          <>
            <View style={styles.subscriptionGrid}>
              {subscriptionTiers.map((tier) => (
                <TouchableOpacity
                  key={tier.credits}
                  style={[
                    styles.subscriptionCard,
                    selectedSubscription === tier.credits && styles.subscriptionCardSelected
                  ]}
                  onPress={() => handleSubscriptionSelect(tier.credits)}
                >
                  <Text style={styles.subscriptionCredits}>{tier.credits}</Text>
                  <Text style={styles.subscriptionCreditsLabel}>credits/month</Text>
                  <Text style={styles.subscriptionPrice}>${tier.price.toFixed(2)}</Text>
                  {selectedSubscription === tier.credits && (
                    <View style={styles.selectedIndicator}>
                      <CheckIcon size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {selectedSubscription !== currentSubscription.credits && (
              <TouchableOpacity style={styles.updateButton} onPress={handleSubscriptionChange}>
                <Text style={styles.updateButtonText}>
                  {currentSubscription.isActive ? 'Update Subscription' : 'Start Subscription'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* One-time Purchase Section */}
        <SettingsHeader title="Buy Credits (One-time)" />
        <View style={styles.creditPacksGrid}>
          {creditPacks.map((pack) => {
            const totalCredits = pack.credits + (pack.bonus || 0);
            const pricePerCredit = pack.price / pack.credits;
            return (
              <TouchableOpacity
                key={pack.credits}
                style={styles.creditPackCard}
                onPress={() => handleCreditPurchase(totalCredits)}
              >
                <Text style={styles.creditPackCredits}>
                  {pack.credits}
                </Text>
                <Text style={styles.creditPackCreditsLabel}>credits</Text>
                <Text style={styles.creditPackPrice}>
                  ${pack.price.toFixed(0)}
                </Text>
                {pack.bonus && (
                  <View style={styles.bonusBadgeTopRight}>
                    <Text style={styles.bonusTextTopRight}>+{pack.bonus} credits</Text>
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
  balanceSection: {
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
    marginBottom: 16,
  },
  balanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAmount: {
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.emerald[600],
    lineHeight: 52,
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
  subscriptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subscriptionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  subscriptionCardSelected: {
    borderColor: theme.colors.emerald[500],
    backgroundColor: theme.colors.emerald[50],
  },
  subscriptionCredits: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.zinc[900],
    textAlign: 'center',
  },
  subscriptionCreditsLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.zinc[600],
    marginBottom: 8,
    textAlign: 'center',
  },
  subscriptionPrice: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.emerald[600],
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.emerald[500],
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButton: {
    backgroundColor: theme.colors.emerald[600],
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  updateButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
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
  },
  bonusBadgeTopRight: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.emerald[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bonusTextTopRight: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: '#fff',
  },
  expirationWarning: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[500],
    textAlign: 'center',
    marginTop: 8,
    fontWeight: theme.fontWeight.medium,
  },
});