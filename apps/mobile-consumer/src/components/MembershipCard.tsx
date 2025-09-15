import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DiamondIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { getMembershipTier, getMembershipBadgeInfo } from '../utils/membershipUtils';

interface MembershipCardProps {
  creditBalance: number;
  allTimeBookings: number;
  expiringCredits?: number;
  daysUntilExpiry?: number;
}

export function MembershipCard({
  creditBalance,
  allTimeBookings,
  expiringCredits,
  daysUntilExpiry
}: MembershipCardProps) {
  const tier = getMembershipTier(allTimeBookings);
  const badgeInfo = getMembershipBadgeInfo(tier);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10b981', '#6ee7b7']} // emerald-500 to emerald-300
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header Row */}
        <View style={styles.header}>
          <Text style={styles.membershipText}>KymaClub membership</Text>
          <View style={[styles.badge, { backgroundColor: badgeInfo.backgroundColor }]}>
            <Text style={[styles.badgeText, { color: badgeInfo.color }]}>
              {badgeInfo.tier}
            </Text>
          </View>
        </View>

        {/* Credits Display */}
        <View style={styles.creditsSection}>
          <View style={styles.creditsRow}>
            <DiamondIcon size={20} color="white" />
            <Text style={styles.creditsAmount}>{creditBalance}</Text>
          </View>
          <Text style={styles.expiryText}>
            {expiringCredits && daysUntilExpiry
              ? `${expiringCredits} credits expire in ${daysUntilExpiry} days`
              : ' '
            }
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
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
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
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
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  creditsAmount: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.extrabold,
    color: 'white',
    marginLeft: 8,
  },
  expiryText: {
    fontSize: theme.fontSize.sm,
    color: 'white',
    opacity: 0.9,
    fontWeight: theme.fontWeight.bold,
  },
});