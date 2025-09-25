import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useAction } from 'convex/react';

import { theme } from '../theme';
import { api } from '@repo/api/convex/_generated/api';
import { calculateSubscriptionPricing } from '@repo/api/operations/payments';

interface SubscriptionSheetProps {
  subscription?: {
    _id: string;
    creditAmount: number;
    status: string;
    cancelAtPeriodEnd?: boolean;
  } | null;
  snapPoints?: Array<string | number>;
  onChange?: (index: number) => void;
}

interface SubscriptionOption {
  credits: number;
  price: number;
  pricePerCredit: number;
  discount: number;
}

const formatCurrency = (amount: number) => `${amount.toFixed(2)} €`;

const buildSubscriptionOptions = (): SubscriptionOption[] => {
  const options: SubscriptionOption[] = [];
  for (let credits = 20; credits <= 500; credits += 5) {
    const pricing = calculateSubscriptionPricing(credits);
    options.push({
      credits,
      price: pricing.priceInCents / 100,
      pricePerCredit: pricing.pricePerCredit,
      discount: pricing.discount,
    });
  }
  return options;
};

const subscriptionOptions = buildSubscriptionOptions();

export const SubscriptionSheet = React.forwardRef<BottomSheetModal, SubscriptionSheetProps>(
  ({ subscription, snapPoints, onChange }, ref) => {
    const resolvedSnapPoints = useMemo(() => snapPoints ?? ['80%'], [snapPoints]);

    const [selectedCredits, setSelectedCredits] = useState<number>(subscription?.creditAmount ?? 20);
    const [isProcessing, setIsProcessing] = useState(false);

    const createDynamicCheckout = useAction(api.actions.payments.createDynamicSubscriptionCheckout);
    const updateSubscription = useAction(api.actions.payments.updateSubscription);
    const cancelSubscription = useAction(api.actions.payments.cancelSubscription);
    const reactivateSubscription = useAction(api.actions.payments.reactivateSubscription);

    useEffect(() => {
      if (subscription?.creditAmount) {
        setSelectedCredits(subscription.creditAmount);
      }
    }, [subscription?.creditAmount]);

    const getCurrentOption = useCallback(() => {
      return (
        subscriptionOptions.find(option => option.credits === selectedCredits) ?? subscriptionOptions[0]
      );
    }, [selectedCredits]);

    const getSliderValue = useCallback((credits: number) => {
      const index = subscriptionOptions.findIndex(option => option.credits === credits);
      return index >= 0 ? index / (subscriptionOptions.length - 1) : 0;
    }, []);

    const isActive = subscription?.status === 'active';
    const isCanceling = Boolean(subscription?.cancelAtPeriodEnd);
    const selectedMatchesCurrent = selectedCredits === (subscription?.creditAmount ?? 0);

    const handleSliderChange = useCallback((value: number) => {
      const index = Math.round(value * (subscriptionOptions.length - 1));
      setSelectedCredits(subscriptionOptions[index].credits);
    }, []);

    const handlePrimaryAction = useCallback(async () => {
      if (isProcessing) return;

      const currentOption = getCurrentOption();
      setIsProcessing(true);

      try {
        if (isCanceling) {
          const result = await reactivateSubscription({ newCreditAmount: selectedCredits });
          Alert.alert('Subscription reactivated', result.message ?? 'Subscription reactivated.');
        } else if (isActive) {
          if (selectedMatchesCurrent) {
            Alert.alert('Subscription', 'This credit amount is already active.');
          } else {
            const result = await updateSubscription({ newCreditAmount: selectedCredits });
            Alert.alert('Subscription updated', result.message ?? 'Your subscription was updated.');
          }
        } else {
          const result = await createDynamicCheckout({ creditAmount: selectedCredits });
          if (result.checkoutUrl) {
            await Linking.openURL(result.checkoutUrl);
          } else {
            Alert.alert('Error', 'Unable to start subscription. Please try again later.');
          }
        }
      } catch (error) {
        console.error('subscription action error', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }, [
      createDynamicCheckout,
      getCurrentOption,
      isActive,
      isCanceling,
      isProcessing,
      reactivateSubscription,
      selectedCredits,
      selectedMatchesCurrent,
      updateSubscription,
    ]);

    const handleCancel = useCallback(async () => {
      if (!isActive || isCanceling || isProcessing) return;

      Alert.alert(
        'Cancel recurring buy',
        'Are you sure you want to cancel? You will keep access until the end of the current period.',
        [
          { text: 'Keep', style: 'cancel' },
          {
            text: 'Cancel recurring buy',
            style: 'destructive',
            onPress: async () => {
              setIsProcessing(true);
              try {
                await cancelSubscription({});
                Alert.alert('Recurring buy canceled', 'You will not be charged again.');
              } catch (error) {
                console.error('cancel subscription error', error);
                Alert.alert('Error', 'Failed to cancel. Please try again.');
              } finally {
                setIsProcessing(false);
              }
            },
          },
        ],
      );
    }, [cancelSubscription, isActive, isCanceling, isProcessing]);

    const option = getCurrentOption();

    const primaryButtonLabel = isCanceling
      ? 'Reactivate recurring buy'
      : isActive
        ? 'Update recurring buy'
        : 'Start recurring buy';

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={resolvedSnapPoints}
        onChange={onChange}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        style={styles.sheetContainer}
      >
        <BottomSheetView style={styles.sheetContent}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Recurring buy</Text>
            <Text style={styles.subtitle}>
              Choose the monthly credits you want to receive automatically.
            </Text>

            <View style={styles.selectedCard}>
              {option.discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{option.discount}% off</Text>
                </View>
              )}

              <Text style={styles.creditValue}>{selectedCredits}</Text>
              <Text style={styles.creditLabel}>credits / month</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatCurrency(option.price)}</Text>
                <Text style={styles.priceSuffix}>per month</Text>
              </View>
              <Text style={styles.pricePerCredit}>
                {formatCurrency(option.pricePerCredit)} per credit
              </Text>
            </View>

            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>20</Text>
              <Text style={styles.sliderLabel}>500</Text>
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

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (isActive && !isCanceling && selectedMatchesCurrent) && styles.primaryButtonDisabled,
              ]}
              onPress={handlePrimaryAction}
              disabled={(isActive && !isCanceling && selectedMatchesCurrent) || isProcessing}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isProcessing ? 'Processing…' : primaryButtonLabel}
              </Text>
            </TouchableOpacity>

            {isActive && !isCanceling && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel recurring buy
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

SubscriptionSheet.displayName = 'SubscriptionSheet';

const styles = StyleSheet.create({
  sheetContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  sheetBackground: {
    backgroundColor: theme.colors.zinc[50],
  },
  sheetHandle: {
    backgroundColor: theme.colors.zinc[300],
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[500],
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  selectedCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: theme.colors.emerald[50],
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.emerald[200],
  },
  discountText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.emerald[700],
  },
  creditValue: {
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.extrabold,
    color: theme.colors.emerald[600],
  },
  creditLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[500],
    marginTop: 4,
    marginBottom: 12,
    fontWeight: theme.fontWeight.medium,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.zinc[900],
  },
  priceSuffix: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.zinc[500],
    marginLeft: 4,
  },
  pricePerCredit: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.zinc[500],
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.zinc[500],
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: theme.colors.emerald[600],
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
  },
  cancelButton: {
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[500],
    textDecorationLine: 'underline',
  },
});
