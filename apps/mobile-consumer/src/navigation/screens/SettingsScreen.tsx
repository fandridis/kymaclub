import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, NavigationProp } from '@react-navigation/native';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { BellIcon, ShieldIcon, CameraIcon, LogOutIcon } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsHeader, SettingsRow } from '../../components/Settings';
import { SettingsGroup } from '../../components/Settings';
import { useAuthenticatedUser } from '../../stores/auth-store';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { useCompressedImageUpload } from '../../hooks/useCompressedImageUpload';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { MembershipCard } from '../../components/MembershipCard';
import { QuickBuyCreditsSheet } from '../../components/QuickBuyCreditsSheet';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import type { RootStackParamList } from '../index';
import { CommonActions } from "@react-navigation/native";
import { useLogout } from '../../hooks/useLogout';

export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const logout = useLogout();
  const user = useAuthenticatedUser();

  const creditBalance = useQuery(api.queries.credits.getUserBalance, { userId: user._id });
  const expiringCredits = useQuery(api.queries.credits.getUserExpiringCredits, { userId: user._id });

  // Get user profile image URL
  const profileImageUrl = useQuery(api.queries.uploads.getUserProfileImageUrl, { userId: user._id });

  // Get user subscription status
  const subscription = useQuery(api.queries.subscriptions.getCurrentUserSubscription);

  // Image upload hooks and mutations
  const { status, pickAndUploadImage, takeAndUploadPhoto } = useCompressedImageUpload({
    preCompressionMaxBytes: 10 * 1024 * 1024, // 10MB
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
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout(() => {
              // Navigate to Landing screen after logout
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Landing" }],
                })
              );
            });
          }
        }
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

  const subscriptionCopy = useMemo(() => {
    const defaultCopy = {
      isActive: false,
      buyCardSubtitle: 'Start recurring buy',
      membershipCardStatus: {
        isActive: false,
        label: 'No subscription yet',
        detail: 'Save up to 20% with monthly credits',
      } as const,
    };

    if (!subscription) {
      return defaultCopy;
    }

    const ATHENS_TZ = 'Europe/Athens';
    const safeDateLabel = (timestamp?: number | null) => {
      if (!timestamp) return null;
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return null;
      try {
        return format(date, "d MMM", { in: tz(ATHENS_TZ) });
      } catch {
        return null;
      }
    };

    const cycleEndLabel = safeDateLabel(subscription.currentPeriodEnd);
    const planLabel = subscription.planName ?? `${subscription.creditAmount} credits monthly`;
    const commonCopy = {
      buyCardSubtitle: `${subscription.creditAmount} credits/month`,
    } as const;

    switch (subscription.status) {
      case 'active': {
        const isCanceling = Boolean(subscription.cancelAtPeriodEnd);
        const detail = isCanceling
          ? (cycleEndLabel ? `Ends ${cycleEndLabel}` : planLabel)
          : cycleEndLabel
            ? `Renews ${cycleEndLabel}`
            : planLabel;

        return {
          isActive: true,
          ...commonCopy,
          membershipCardStatus: {
            isActive: true,
            label: isCanceling ? 'Cancelling soon' : 'Subscription active',
            detail,
          },
        };
      }
      case 'trialing': {
        return {
          isActive: true,
          ...commonCopy,
          membershipCardStatus: {
            isActive: true,
            label: 'Trial active',
            detail: cycleEndLabel ? `Renews ${cycleEndLabel}` : planLabel,
          },
        };
      }
      case 'past_due': {
        return {
          isActive: false,
          buyCardSubtitle: 'Fix payment to continue',
          membershipCardStatus: {
            isActive: false,
            label: 'Payment past due',
            detail: 'Update your payment method to keep credits flowing',
          },
        };
      }
      case 'incomplete': {
        return {
          isActive: false,
          buyCardSubtitle: 'Finish checkout to activate',
          membershipCardStatus: {
            isActive: false,
            label: 'Action needed',
            detail: 'Complete checkout to activate your plan',
          },
        };
      }
      case 'unpaid': {
        return {
          isActive: false,
          buyCardSubtitle: 'Reactivate subscription',
          membershipCardStatus: {
            isActive: false,
            label: 'Subscription paused',
            detail: 'Reactivate to resume monthly credits',
          },
        };
      }
      default:
        return defaultCopy;
    }
  }, [subscription]);

  const creditsSheetRef = useRef<BottomSheetModal>(null);
  const creditsSnapPoints = useMemo(() => ['70%'], []);

  const handleOpenCreditsSheet = useCallback(() => {
    creditsSheetRef.current?.present();
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
            expiringCredits={expiringCredits?.expiringCredits}
            daysUntilExpiry={expiringCredits?.daysUntilExpiry}
            subscriptionStatus={subscriptionCopy.membershipCardStatus}
            subscription={subscription}
          />

          {/* Manage Credits Section */}
          <SettingsHeader title="Manage Credits" />
          <SettingsGroup>
            <SettingsRow
              title="Quick buy"
              subtitle="Instantly get an amount of credits"
              renderRightSide={() => (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleOpenCreditsSheet}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>Buy credits</Text>
                </TouchableOpacity>
              )}
            />
            <SettingsRow
              title="Subscription"
              renderSubtitle={() => {
                const isActive = subscription?.status === 'active';
                const isCanceling = Boolean(subscription?.cancelAtPeriodEnd);
                const isPaused = subscription?.status === 'unpaid' || subscription?.status === 'past_due';

                if (isActive && !isCanceling) {
                  return (
                    <View style={styles.subtitleRow}>
                      <View style={[styles.statusDot, styles.statusDotActive]} />
                      <Text style={styles.subtitleText}>
                        {subscription.creditAmount} credits/month
                      </Text>
                    </View>
                  );
                } else if (isPaused || isCanceling) {
                  return (
                    <View style={styles.subtitleRow}>
                      <View style={[styles.statusDot, styles.statusDotInactive]} />
                      <Text style={styles.subtitleText}>Paused</Text>
                    </View>
                  );
                } else {
                  return (
                    <View style={styles.subtitleRow}>
                      <View style={[styles.statusDot, styles.statusDotInactive]} />
                      <Text style={styles.subtitleText}>Inactive</Text>
                    </View>
                  );
                }
              }}
              renderRightSide={() => {
                const isActive = subscription?.status === 'active';
                const isCanceling = Boolean(subscription?.cancelAtPeriodEnd);
                const isPaused = subscription?.status === 'unpaid' || subscription?.status === 'past_due';

                let buttonText = 'Start here';
                if (isActive && !isCanceling) {
                  buttonText = 'Update';
                } else if (isPaused || isCanceling) {
                  buttonText = 'Resume';
                }

                return (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Subscription' as never)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>{buttonText}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </SettingsGroup>

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

        <QuickBuyCreditsSheet
          ref={creditsSheetRef}
          snapPoints={creditsSnapPoints}
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

  buyCreditsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
    textAlign: 'center',
    marginBottom: 12,
  },
  buyCreditsCard: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.zinc[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[500],
    lineHeight: 18,
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

  // New styles for Manage Credits section
  actionButton: {
    backgroundColor: theme.colors.emerald[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: 'white',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: theme.colors.emerald[500],
  },
  statusDotInactive: {
    backgroundColor: theme.colors.rose[500],
  },
  subtitleText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[600],
    fontWeight: theme.fontWeight.medium,
  },
});
