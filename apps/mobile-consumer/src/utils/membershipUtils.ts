// Membership badge logic based on booking count

export type MembershipTier = 'Newbie' | 'Rising Star' | 'Pro' | 'VIP';

export interface MembershipBadgeInfo {
  tier: MembershipTier;
  color: string;
  backgroundColor: string;
}

/**
 * Get membership tier based on all-time booking count
 * 0-10: Newbie
 * 11-100: Rising Star
 * 101-999: Pro
 * 1000+: VIP
 */
export function getMembershipTier(allTimeBookings: number): MembershipTier {
  if (allTimeBookings >= 1000) return 'VIP';
  if (allTimeBookings >= 101) return 'Pro';
  if (allTimeBookings >= 11) return 'Rising Star';
  return 'Newbie';
}

/**
 * Get badge styling information for membership tier
 */
export function getMembershipBadgeInfo(tier: MembershipTier): MembershipBadgeInfo {
  switch (tier) {
    case 'Newbie':
      return {
        tier,
        color: '#65a30d', // lime-600
        backgroundColor: '#ecfccb', // lime-100
      };
    case 'Rising Star':
      return {
        tier,
        color: '#0369a1', // sky-700
        backgroundColor: '#e0f2fe', // sky-100
      };
    case 'Pro':
      return {
        tier,
        color: '#7c2d12', // orange-800
        backgroundColor: '#fed7aa', // orange-200
      };
    case 'VIP':
      return {
        tier,
        color: '#7c3aed', // violet-600
        backgroundColor: '#ede9fe', // violet-100
      };
  }
}