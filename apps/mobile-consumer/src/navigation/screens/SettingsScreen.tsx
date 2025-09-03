import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BellIcon, CreditCardIcon, ShieldIcon, CameraIcon, LogOutIcon, RefreshCwIcon, DiamondIcon, CrownIcon, ZapIcon } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsHeader, SettingsRow } from '../../components/Settings';
import { SettingsGroup } from '../../components/Settings';
import { useAuth, useAuthenticatedUser } from '../../stores/auth-store';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { useCompressedImageUpload } from '../../hooks/useCompressedImageUpload';
import { TabScreenHeader } from '../../components/TabScreenHeader';
import { MembershipCard } from '../../components/MembershipCard';

export function SettingsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const user = useAuthenticatedUser();

  // Get user credit balance
  const creditBalance = useQuery(api.queries.credits.getUserBalance, { userId: user._id });

  // Get user profile image URL
  const profileImageUrl = useQuery(api.queries.uploads.getUserProfileImageUrl, { userId: user._id });

  // Get user subscription status
  const subscription = useQuery(api.queries.subscriptions.getCurrentUserSubscription);

  // Image upload hooks and mutations
  const { status, pickAndUploadImage, takeAndUploadPhoto } = useCompressedImageUpload({
    preCompressionMaxBytes: 5 * 1024 * 1024, // 5MB
    compression: {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.8,
    },
  });

  const updateProfileImage = useMutation(api.mutations.uploads.updateUserProfileImage);
  const removeProfileImage = useMutation(api.mutations.uploads.removeUserProfileImage);

  // Get user booking statistics
  const bookingStats = useQuery(api.queries.bookings.getUserBookingStats);

  // Get user expiring credits
  const expiringCredits = useQuery(api.queries.credits.getUserExpiringCredits, { userId: user._id });

  const handleAvatarPress = () => {
    if (status !== "idle") return; // Prevent multiple uploads

    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              await takeAndUploadPhoto(async (storageId: string) => {
                await updateProfileImage({ storageId: storageId as any });
                return storageId;
              });
            } catch (error) {
              console.error('Error taking photo:', error);
            }
          }
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            try {
              await pickAndUploadImage(async (storageId: string) => {
                await updateProfileImage({ storageId: storageId as any });
                return storageId;
              });
            } catch (error) {
              console.error('Error picking image:', error);
            }
          }
        },
        ...(profileImageUrl ? [{
          text: 'Remove Photo',
          style: 'destructive' as const,
          onPress: async () => {
            try {
              await removeProfileImage({});
            } catch (error) {
              console.error('Error removing profile image:', error);
              Alert.alert('Error', 'Failed to remove profile image');
            }
          }
        }] : []),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const getSubscriptionSubtitle = () => {
    if (!subscription || subscription.status !== 'active') {
      return 'Inactive subscription';
    }

    // Format next billing date
    // const nextBilling = new Date(subscription.currentPeriodEnd);
    // const formatter = new Intl.DateTimeFormat('en-US', {
    //   month: 'short',
    //   day: 'numeric'
    // });

    // If subscription is set to cancel at period end, show cancellation message
    if (subscription.cancelAtPeriodEnd) {
      return `${subscription.creditAmount} credits/month`;
    }

    return `${subscription.creditAmount} credits/month`;
  };

  const isSubscriptionActiveAndNotExpiring = () => {
    return subscription && subscription.status === 'active';
  };

  const isSubscriptionActiveAndExpiring = () => {
    return subscription && subscription.status === 'active' && subscription.cancelAtPeriodEnd;
  };

  return (
    <SafeAreaView style={styles.container}>
      <TabScreenHeader title="Settings" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* New Header Design */}
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>Hi {user.name?.split(' ')[0] || 'there'}!</Text>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            disabled={status !== "idle"}
          >
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {getInitials(user.name || 'User')}
                </Text>
              </View>
            )}
            <View style={[styles.avatarOverlay, status !== "idle" && styles.avatarOverlayLoading]}>
              <CameraIcon
                size={16}
                color={status !== "idle" ? theme.colors.zinc[400] : "#fff"}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Membership Card */}
        <MembershipCard
          creditBalance={creditBalance?.balance || 0}
          allTimeBookings={bookingStats?.allTime || 0}
          expiringCredits={expiringCredits?.expiringCredits}
          daysUntilExpiry={expiringCredits?.daysUntilExpiry}
        />

        {/* Statistics */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{bookingStats?.thisMonth || 0}</Text>
              <Text style={styles.statLabel}>Classes this month</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{bookingStats?.allTime || 0}</Text>
              <Text style={styles.statLabel}>Classes all-time</Text>
            </View>
          </View>
        </View>

        {/* Credits Management */}
        <SettingsHeader title="Credits Management" />
        <SettingsGroup>
          <SettingsRow
            icon={CrownIcon}
            title="Monthly Subscription"
            subtitle={getSubscriptionSubtitle()}
            renderRightSide={() => {
              const getStatusStyle = () => {
                if (isSubscriptionActiveAndNotExpiring()) {
                  return {
                    backgroundColor: theme.colors.emerald[100],
                    textColor: theme.colors.emerald[700],
                    text: 'ACTIVE'
                  };
                } else if (isSubscriptionActiveAndExpiring()) {
                  return {
                    backgroundColor: theme.colors.amber[100],
                    textColor: theme.colors.amber[700],
                    text: 'EXPIRING'
                  };
                } else {
                  return {
                    backgroundColor: theme.colors.zinc[100],
                    textColor: theme.colors.zinc[600],
                    text: 'INACTIVE'
                  };
                }
              };

              const statusStyle = getStatusStyle();

              return (
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                  <Text style={[styles.statusBadgeText, { color: statusStyle.textColor }]}>
                    {statusStyle.text}
                  </Text>
                </View>
              );
            }}
            onPress={() => navigation.navigate('Subscription')}
          />
          {/* 
          <SettingsRow
            icon={ZapIcon}
            title="Superpowers"
            subtitle="Boost your class bookings with special features"
            renderRightSide={() => (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>2</Text>
              </View>
            )}
            onPress={() => navigation.navigate('Superpowers')}
          />
          */}
          <SettingsRow
            icon={CreditCardIcon}
            title="Buy Credits"
            subtitle="One-time credit packs without subscription"
            onPress={() => navigation.navigate('BuyCredits')}
          />
        </SettingsGroup>


        {/* Settings Navigation */}
        <SettingsHeader title="Settings" />
        <SettingsGroup>
          <SettingsRow
            title="Notifications"
            subtitle="Push notifications, email preferences"
            onPress={() => navigation.navigate('SettingsNotifications')}
            icon={BellIcon}
          />
          <SettingsRow
            title="Account Settings"
            subtitle="Privacy, security, data"
            onPress={() => navigation.navigate('SettingsAccount')}
            icon={ShieldIcon}
          />
        </SettingsGroup>

        {/* Account Actions */}
        <SettingsHeader title="Account" />
        <SettingsGroup>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleLogout}
          >
            <View style={styles.logoutContent}>
              <View style={styles.logoutIconContainer}>
                <LogOutIcon
                  size={20}
                  color={theme.colors.rose[500]}
                />
              </View>
              <Text style={styles.logoutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </SettingsGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
  },
  scrollContent: {
    paddingBottom: 80,
  },
  // New header section
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.zinc[50],
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greeting: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.zinc[900],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.emerald[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarOverlayLoading: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  // Statistics card
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.emerald[50],
    borderWidth: 1,
    borderColor: theme.colors.emerald[100],
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.emerald[200],
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.emerald[950],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.emerald[700],
    textAlign: 'center',
    fontWeight: theme.fontWeight.medium,
  },

  logoutRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 44,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  logoutIconContainer: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: theme.colors.rose[500],
    fontWeight: theme.fontWeight.medium,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  countBadge: {
    backgroundColor: theme.colors.sky[100],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.sky[950],
  },
});