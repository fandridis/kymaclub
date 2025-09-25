import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { BellIcon, CreditCardIcon, ShieldIcon, CameraIcon, LogOutIcon, CrownIcon, ZapIcon } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsHeader, SettingsRow } from '../../components/Settings';
import { SettingsGroup } from '../../components/Settings';
import { useAuth, useAuthenticatedUser } from '../../stores/auth-store';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { useCompressedImageUpload } from '../../hooks/useCompressedImageUpload';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { MembershipCard } from '../../components/MembershipCard';
import { QuickBuyCreditsSheet } from '../../components/QuickBuyCreditsSheet';
import { SubscriptionSheet } from '../../components/SubscriptionSheet';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export function SettingsScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const user = useAuthenticatedUser();

  const creditBalance = useQuery(api.queries.credits.getUserBalance, { userId: user._id });
  const expiringCredits = useQuery(api.queries.credits.getUserExpiringCredits, { userId: user._id });

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
    return subscription && subscription.status === 'active' && !subscription.cancelAtPeriodEnd;
  };

  const isSubscriptionActiveAndExpiring = () => {
    return subscription && subscription.status === 'active' && subscription.cancelAtPeriodEnd;
  };

  const recurringActive = isSubscriptionActiveAndNotExpiring() || isSubscriptionActiveAndExpiring();
  const recurringCanceling = isSubscriptionActiveAndExpiring();

  const subscriptionSheetRef = useRef<BottomSheetModal>(null);
  const quickBuySheetRef = useRef<BottomSheetModal>(null);
  const subscriptionSnapPoints = useMemo(() => ['80%'], []);
  const quickBuySnapPoints = useMemo(() => ['60%'], []);

  const handleManageSubscription = useCallback(() => {
    subscriptionSheetRef.current?.present();
  }, []);

  const handleBuyCredits = useCallback(() => {
    quickBuySheetRef.current?.present();
  }, []);

  const handleSheetChange = useCallback((index: number) => {
    // Placeholder for analytics when hooking real data
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <BottomSheetModalProvider>
        <StackScreenHeader title="Settings" />
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
            creditBalance={creditBalance?.balance ?? 0}
            recurringCreditAmount={subscription?.creditAmount}
            isRecurringActive={recurringActive ?? false}
            isRecurringCanceling={recurringCanceling ?? false}
            expiringCredits={expiringCredits?.expiringCredits}
            expiringDaysUntil={expiringCredits?.daysUntilExpiry}
            onManageSubscriptionPress={handleManageSubscription}
            onBuyCreditsPress={handleBuyCredits}
          />

          {/* Statistics
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
          </View> */}

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

        <SubscriptionSheet
          ref={subscriptionSheetRef}
          subscription={subscription}
          snapPoints={subscriptionSnapPoints}
          onChange={handleSheetChange}
        />
        <QuickBuyCreditsSheet
          ref={quickBuySheetRef}
          snapPoints={quickBuySnapPoints}
          onChange={handleSheetChange}
        />
      </BottomSheetModalProvider>
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
    width: 40,
    height: 40,
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
