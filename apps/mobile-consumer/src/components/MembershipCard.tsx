import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WalletIcon, InfoIcon, AlertTriangleIcon } from 'lucide-react-native';

import { theme } from '../theme';

interface MembershipCardProps {
  creditBalance: number;
  recurringCreditAmount?: number | null;
  isRecurringActive?: boolean;
  isRecurringCanceling?: boolean;
  expiringCredits?: number | null;
  expiringDaysUntil?: number | null;
  onManageSubscriptionPress?: () => void;
  onBuyCreditsPress?: () => void;
}

export function MembershipCard({
  creditBalance,
  recurringCreditAmount,
  isRecurringActive,
  isRecurringCanceling,
  expiringCredits,
  expiringDaysUntil,
  onManageSubscriptionPress,
  onBuyCreditsPress,
}: MembershipCardProps) {
  const hasRecurring = Boolean(isRecurringActive && !isRecurringCanceling);

  const RecurringIcon = hasRecurring ? InfoIcon : AlertTriangleIcon;
  const recurringIconColor = hasRecurring
    ? theme.colors.emerald[500]
    : theme.colors.amber[500];

  const recurringAmountLabel = (() => {
    if (!hasRecurring) return 'Not active';
    const amount = `${recurringCreditAmount ?? 0} credits`;
    return amount;
  })();

  const expiringAmount = expiringCredits ?? 0;
  const expiringLabel = expiringAmount > 0
    ? expiringDaysUntil != null && expiringDaysUntil >= 0
      ? `${expiringAmount} credits (${expiringDaysUntil} days)`
      : `${expiringAmount} credits`
    : 'No credits expiring';

  const handleSubscriptionPress = () => {
    onManageSubscriptionPress?.();
  };

  const handleBuyCreditsPress = () => {
    onBuyCreditsPress?.();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.rowStart}>
            <WalletIcon size={20} color={theme.colors.zinc[900]} />
            <Text style={styles.cardTitle}>Wallet Balance</Text>
          </View>
          <Text style={styles.cardValue}>{creditBalance}</Text>
        </View>

        <Text style={styles.subtitle}>These are the available credits to spend</Text>

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <View style={styles.rowStart}>
            <Text style={styles.sectionTitle}>Recurring buy</Text>
            <RecurringIcon size={16} color={recurringIconColor} style={styles.iconSpacing} />
          </View>
          <TouchableOpacity
            onPress={handleSubscriptionPress}
            activeOpacity={0.75}
            disabled={!onManageSubscriptionPress}
          >
            <Text style={[styles.sectionValue, styles.recurringLink]}>{recurringAmountLabel}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rowBetween}>
          <View style={styles.rowStart}>
            <Text style={styles.sectionTitle}>Expiring soon</Text>
            <InfoIcon size={16} color={theme.colors.sky[500]} style={styles.iconSpacing} />
          </View>
          <Text style={styles.sectionValue}>{expiringLabel}</Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity activeOpacity={0.8} onPress={handleBuyCreditsPress}>
          <Text style={styles.link}>Buy credits</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    marginLeft: 8,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
  },
  cardValue: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
  },
  balanceDisplay: {
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 12,
  },
  balanceValue: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.zinc[900],
  },
  balanceLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.zinc[500],
    marginTop: 2,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[500],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.zinc[200],
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.zinc[600],
  },
  sectionValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
  },
  recurringLink: {
    color: theme.colors.emerald[600],
    textDecorationLine: 'underline',
  },
  iconSpacing: {
    marginLeft: 6,
  },
  link: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.emerald[600],
    textDecorationLine: 'underline',
  },
});
