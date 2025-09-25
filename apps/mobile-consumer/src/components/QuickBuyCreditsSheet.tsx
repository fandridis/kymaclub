import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useAction } from 'convex/react';
import { DiamondIcon } from 'lucide-react-native';

import { theme } from '../theme';
import { CREDIT_PACKS } from '@repo/api/operations/payments';
import { api } from '@repo/api/convex/_generated/api';

interface QuickBuyCreditsSheetProps {
  snapPoints?: Array<string | number>;
  onChange?: (index: number) => void;
}

interface DisplayPack {
  credits: number;
  price: number;
  badgeLabel: string;
  isDiscounted: boolean;
}

const formatCurrency = (amount: number) => `${amount.toFixed(2)} €`;

export const QuickBuyCreditsSheet = React.forwardRef<BottomSheetModal, QuickBuyCreditsSheetProps>(
  ({ snapPoints, onChange }, ref) => {
    const resolvedSnapPoints = useMemo(() => snapPoints ?? ['60%'], [snapPoints]);

    const [selectedCredits, setSelectedCredits] = useState<number>(CREDIT_PACKS[0]?.credits ?? 10);
    const [isProcessing, setIsProcessing] = useState(false);

    const createOneTimeCheckout = useAction(api.actions.payments.createOneTimeCreditCheckout);

    const packsForDisplay: DisplayPack[] = useMemo(() => {
      return CREDIT_PACKS.map(pack => {
        const basePrice = Number(pack.price.toFixed(2));
        const baseDiscount = pack.discount ?? 0;

        return {
          credits: pack.credits,
          price: basePrice,
          badgeLabel: baseDiscount ? `${baseDiscount}% off` : 'Full price',
          isDiscounted: Boolean(baseDiscount),
        };
      });
    }, []);

    const selectedPack = packsForDisplay.find(pack => pack.credits === selectedCredits);

    const handlePackSelect = useCallback((credits: number) => {
      setSelectedCredits(credits);
    }, []);

    const handlePurchase = useCallback(async () => {
      if (!selectedPack) {
        return;
      }

      setIsProcessing(true);

      try {
        const result = await createOneTimeCheckout({ creditAmount: selectedPack.credits });
        if (result.checkoutUrl) {
          await Linking.openURL(result.checkoutUrl);
        } else {
          Alert.alert('Error', 'Unable to start checkout. Please try again later.');
        }
      } catch (error) {
        console.error('quick buy error', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }, [createOneTimeCheckout, selectedPack]);

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
            <Text style={styles.sheetTitle}>Buy credits</Text>
            <Text style={styles.sheetSubtitle}>Top-up your credits balance</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsContainer}
            >
              {packsForDisplay.map(pack => {
                const isSelected = pack.credits === selectedCredits;

                return (
                  <TouchableOpacity
                    key={pack.credits}
                    style={[styles.creditCard, isSelected && styles.creditCardSelected]}
                    onPress={() => handlePackSelect(pack.credits)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardHeader}>
                      <DiamondIcon size={16} color={theme.colors.emerald[500]} />
                    </View>

                    <Text style={styles.cardCredits}>{pack.credits}</Text>
                    <Text style={styles.cardPrice}>{formatCurrency(pack.price)}</Text>

                    <View
                      style={[
                        styles.badge,
                        pack.isDiscounted ? styles.badgeDiscount : styles.badgeNeutral,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          pack.isDiscounted ? styles.badgeTextDiscount : styles.badgeTextNeutral,
                        ]}
                      >
                        {pack.badgeLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.finePrint}>Credits are valid for 3 months after issuing.</Text>
          </ScrollView>

          <TouchableOpacity
            style={[styles.buyButton, isProcessing && styles.buyButtonDisabled]}
            onPress={handlePurchase}
            activeOpacity={0.85}
            disabled={isProcessing}
          >
            <Text style={styles.buyButtonText}>
              {isProcessing ? 'Processing...' : 'Buy now'}
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

QuickBuyCreditsSheet.displayName = 'QuickBuyCreditsSheet';

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
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[500],
    marginTop: 4,
    textAlign: 'center',
  },
  cardsContainer: {
    paddingVertical: 20,
    paddingLeft: 8,
    paddingRight: 20,
  },
  creditCard: {
    width: 140,
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  creditCardSelected: {
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
    marginBottom: 6,
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
  finePrint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.zinc[400],
    textAlign: 'center',
  },
  buyButton: {
    backgroundColor: theme.colors.emerald[600],
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonDisabled: {
    opacity: 0.7,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
});
