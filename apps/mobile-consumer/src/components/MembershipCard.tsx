import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DiamondIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';

import { theme } from '../theme';

interface MembershipCardProps {
  creditBalance: number;
  expiringCredits?: number;
  daysUntilExpiry?: number;
  subscriptionStatus?: {
    isActive: boolean;
    label: string;
    detail?: string;
  };
  subscription?: {
    creditAmount: number;
    currentPeriodEnd?: number | null;
  } | null;
}

export function MembershipCard({
  creditBalance,
  expiringCredits,
  daysUntilExpiry,
  subscriptionStatus,
  subscription,
}: MembershipCardProps) {
  const resolvedSubscriptionStatus = subscriptionStatus ?? {
    isActive: false,
    label: 'No subscription yet',
    detail: 'Start a plan to unlock monthly savings',
  };

  // Format subscription renewal date
  const getSubscriptionRenewalDate = () => {
    if (!subscription?.currentPeriodEnd) return null;
    try {
      return format(new Date(subscription.currentPeriodEnd), 'dd/MM', {
        in: tz('Europe/Athens')
      });
    } catch {
      return null;
    }
  };

  const renewalDate = getSubscriptionRenewalDate();

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={['#10b981', '#6ee7b7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.header}>
            <Text style={styles.membershipText}>KymaClub membership</Text>
          </View>

          <View style={styles.creditsSection}>
            <Text style={styles.creditsSubtext}>AVAILABLE CREDITS</Text>
            <View style={styles.creditsRow}>
              <DiamondIcon size={20} color="white" strokeWidth={3} />
              <Text style={styles.creditsAmount}>{creditBalance}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.creditsInfo}>
              {resolvedSubscriptionStatus.isActive && renewalDate && subscription?.creditAmount ? (
                <Text style={styles.creditsInfoText}>
                  {subscription.creditAmount} credits arriving at {renewalDate}
                </Text>
              ) : expiringCredits && daysUntilExpiry && daysUntilExpiry < 30 ? (
                <Text style={styles.creditsInfoText}>
                  {expiringCredits} credits expire in {daysUntilExpiry} days
                </Text>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 4,
  },
  cardWrapper: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    minHeight: 220,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  membershipText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.extrabold,
    color: 'white',
  },
  creditsSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  creditsSubtext: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: 'white',
    opacity: 0.8,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditsAmount: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.extrabold,
    color: 'white',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
  },
  creditsInfo: {
    minHeight: 20,
  },
  creditsInfoText: {
    fontSize: theme.fontSize.sm,
    color: 'white',
    opacity: 0.9,
    fontWeight: theme.fontWeight.medium,
  },
});
