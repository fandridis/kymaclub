import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DiamondIcon, CrownIcon, CheckIcon, InfoIcon } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsHeader, SettingsGroup, SettingsRow } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { useAuthenticatedUser } from '../../stores/auth-store';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import Slider from '@react-native-community/slider';

// Generate subscription options from 5 to 100 in steps of 5
const generateSubscriptionOptions = () => {
  const options = [];
  for (let i = 5; i <= 100; i += 5) {
    // Progressive pricing: starts at $2.00 per credit, goes down to $1.90 at 100 credits
    // Linear interpolation: pricePerCredit = 2.0 - ((credits - 5) / 95) * 0.1
    const pricePerCredit = 2.0 - ((i - 5) / 95) * 0.1;
    const price = i * pricePerCredit;
    options.push({ credits: i, price: Math.round(price * 100) / 100, pricePerCredit: Math.round(pricePerCredit * 100) / 100 });
  }
  return options;
};

const subscriptionOptions = generateSubscriptionOptions();

type SubscriptionTier = {
  credits: number;
  price: number;
  pricePerCredit?: number;
};

type CreditPack = {
  credits: number;
  price: number;
  bonus?: number;
};

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
  const [selectedSubscription, setSelectedSubscription] = useState<number>(20);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  const [useNativeSlider, setUseNativeSlider] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get user credit balance
  const creditBalance = useQuery(api.queries.credits.getUserBalance, { userId: user._id });

  // Mock current subscription status
  const currentSubscription = {
    isActive: true,
    credits: 20,
    nextBilling: '2025-09-25'
  };

  const handleSliderChange = (value: number) => {
    // Convert slider value (0-1) to credits (5-100)
    const credits = Math.round(value * 19) * 5 + 5;
    setSelectedSubscription(credits);
  };

  const getSliderValue = (credits: number) => {
    // Convert credits (5-100) to slider value (0-1)
    return (credits - 5) / 95;
  };

  const getCurrentOption = () => {
    return subscriptionOptions.find(option => option.credits === selectedSubscription) || subscriptionOptions[3]; // Default to 20 credits
  };

  // Auto-scroll to selected option when switching to custom mode
  useEffect(() => {
    if (!useNativeSlider && scrollViewRef.current) {
      const selectedIndex = subscriptionOptions.findIndex(option => option.credits === selectedSubscription);
      if (selectedIndex >= 0) {
        // Calculate scroll position (button width ~56px + margin ~8px)
        const scrollPosition = selectedIndex * 64;
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: scrollPosition, animated: true });
        }, 100);
      }
    }
  }, [useNativeSlider]);

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
            Alert.alert('Success', `${credits} credits purchased successfully!`);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StackScreenHeader title="Credits" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Credits Balance */}
        <SettingsHeader
          title="Credits Balance"
          subtitle={(() => {
            const mockExpiringCredits = 15;
            const mockDaysUntilExpiry = 12;
            if (mockDaysUntilExpiry < 30 && mockExpiringCredits > 0) {
              return `${mockExpiringCredits} credits expire in ${mockDaysUntilExpiry} days`;
            }
            return undefined;
          })()}
        />
        <SettingsGroup>
          <SettingsRow
            title="Current Balance"
            subtitle="Available credits for booking classes"
            renderRightSide={() => (
              <View style={styles.creditsBadge}>
                <DiamondIcon size={16} color={theme.colors.emerald[600]} />
                <Text style={styles.creditsBadgeText}>{creditBalance?.balance || 0}</Text>
              </View>
            )}
          />
        </SettingsGroup>

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
          <View style={styles.sliderContainer}>
            {/* Current Selection Display */}
            <View style={styles.selectionDisplay}>
              <Text style={styles.selectionCredits}>{selectedSubscription}</Text>
              <Text style={styles.selectionLabel}>credits/month</Text>
              <Text style={styles.selectionPrice}>${getCurrentOption().price.toFixed(2)}/month</Text>
              <Text style={styles.pricePerCredit}>${getCurrentOption().pricePerCredit?.toFixed(2)} per credit</Text>
            </View>

            {/* Slider Type Toggle */}
            <View style={styles.sliderTypeToggle}>
              <Text style={styles.sliderTypeLabel}>Native Slider</Text>
              <Switch
                value={useNativeSlider}
                onValueChange={setUseNativeSlider}
                trackColor={{ false: theme.colors.zinc[300], true: theme.colors.emerald[300] }}
                thumbColor={useNativeSlider ? theme.colors.emerald[600] : theme.colors.zinc[500]}
              />
              <Text style={styles.sliderTypeLabel}>Custom Steps</Text>
            </View>

            {useNativeSlider ? (
              /* Native Slider */
              <View style={styles.sliderWrapper}>
                <Slider
                  style={styles.slider}
                  value={getSliderValue(selectedSubscription)}
                  onValueChange={handleSliderChange}
                  minimumValue={0}
                  maximumValue={1}
                  step={1 / 19} // 20 steps (5, 10, 15, ..., 100)
                  minimumTrackTintColor={theme.colors.emerald[500]}
                  maximumTrackTintColor={theme.colors.zinc[300]}
                  thumbTintColor={theme.colors.emerald[600]}
                />

                {/* Step markers */}
                <View style={styles.stepMarkers}>
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((step, index) => (
                    <View key={step} style={styles.stepMarker}>
                      <View
                        style={[
                          styles.stepDot,
                          selectedSubscription === step && styles.stepDotActive
                        ]}
                      />
                      <Text style={[
                        styles.stepLabel,
                        selectedSubscription === step && styles.stepLabelActive
                      ]}>
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              /* Custom Step Selector */
              <View style={styles.stepSelectorWrapper}>
                <ScrollView
                  ref={scrollViewRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stepScrollContent}
                  style={styles.stepScrollView}
                >
                  {subscriptionOptions.map((option) => (
                    <TouchableOpacity
                      key={option.credits}
                      style={[
                        styles.stepButton,
                        selectedSubscription === option.credits && styles.stepButtonActive
                      ]}
                      onPress={() => setSelectedSubscription(option.credits)}
                    >
                      <Text style={[
                        styles.stepButtonText,
                        selectedSubscription === option.credits && styles.stepButtonTextActive
                      ]}>
                        {option.credits}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {selectedSubscription !== currentSubscription.credits && (
              <TouchableOpacity style={styles.updateButton} onPress={handleSubscriptionChange}>
                <Text style={styles.updateButtonText}>
                  {currentSubscription.isActive ? 'Update Subscription' : 'Start Subscription'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* One-time Purchase Section */}
        <SettingsHeader
          title="Buy Credits (One-time)"
          subtitle="Credits last 90 days from purchase"
        />
        <View style={styles.creditPacksGrid}>
          {creditPacks.map((pack) => {
            const totalCredits = pack.credits + (pack.bonus || 0);
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
                    <Text style={styles.bonusTextTopRight}>+{pack.bonus}</Text>
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
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.emerald[50],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  creditsBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.emerald[700],
    marginLeft: 4,
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  selectionDisplay: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
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
  sliderTypeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: theme.colors.zinc[50],
    borderRadius: 12,
    marginHorizontal: 20,
  },
  sliderTypeLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[600],
    fontWeight: theme.fontWeight.medium,
    marginHorizontal: 12,
  },
  sliderWrapper: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 10,
  },
  stepMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 5,
  },
  stepMarker: {
    alignItems: 'center',
    minWidth: 24,
    flex: 1,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.zinc[300],
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: theme.colors.emerald[500],
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.zinc[500],
  },
  stepLabelActive: {
    color: theme.colors.emerald[600],
    fontWeight: theme.fontWeight.semibold,
  },
  stepSelectorWrapper: {
    marginBottom: 20,
  },
  stepScrollView: {
    marginBottom: 0,
  },
  stepScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  stepButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.zinc[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepButtonActive: {
    backgroundColor: theme.colors.emerald[50],
    borderColor: theme.colors.emerald[500],
  },
  stepButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.zinc[600],
  },
  stepButtonTextActive: {
    color: theme.colors.emerald[700],
    fontWeight: theme.fontWeight.bold,
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
});