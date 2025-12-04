import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, NavigationProp } from '@react-navigation/native';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { BellIcon, ShieldIcon, CameraIcon, LogOutIcon, MapPinIcon, LanguagesIcon, TicketIcon } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsHeader, SettingsRow } from '../../components/Settings';
import { SettingsGroup } from '../../components/Settings';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { useCityLabel } from '../../hooks/use-city-label';
import type { CitySlug } from '@repo/utils/constants';
import { useCompressedImageUpload } from '../../hooks/useCompressedImageUpload';
import { useProfileImageModeration } from '../../hooks/useProfileImageModeration';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { MembershipCard } from '../../components/MembershipCard';
import { QuickBuyCreditsSheet } from '../../components/QuickBuyCreditsSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { RootStackParamList } from '../index';
import { useLogout } from '../../hooks/useLogout';
import { useTypedTranslation } from '../../i18n/typed';

export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const logout = useLogout();
  const { user } = useCurrentUser();
  const { t, i18n } = useTypedTranslation();
  const cityLabel = useCityLabel(user?.activeCitySlug as CitySlug | undefined);

  const getLanguageDisplay = (languageCode: string) => {
    const languages = {
      'en': { name: 'English', flag: '🇺🇸' },
      'el': { name: 'Ελληνικά', flag: '🇬🇷' }
    };
    const lang = languages[languageCode as keyof typeof languages] || languages['en'];
    return `${lang.flag} ${lang.name}`;
  };


  const creditBalance = useQuery(api.queries.credits.getUserBalance, { userId: user?._id! });
  const expiringCredits = useQuery(api.queries.credits.getUserExpiringCredits, { userId: user?._id! });

  // Get user profile image URL
  const profileImageUrl = useQuery(api.queries.uploads.getUserProfileImageUrl, { userId: user?._id! });

  // Get user subscription status
  const subscription = useQuery(api.queries.subscriptions.getCurrentUserSubscription);

  // Profile image moderation status
  const { moderationStatus, isPending, isRejected, statusMessage } = useProfileImageModeration();

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
    if (status !== "idle") return;

    // Show rejection message if image was rejected
    if (isRejected && statusMessage) {
      Alert.alert(
        t('errors.imageNotApproved'),
        statusMessage + '\n\n' + t('errors.uploadNewImage') + '?',
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('errors.uploadNewImage'),
            onPress: () => showUploadOptions()
          }
        ]
      );
      return;
    }

    showUploadOptions();
  };

  const showUploadOptions = () => {
    Alert.alert(
      t('settings.profile.profilePhoto'),
      t('settings.profile.chooseOption'),
      [
        {
          text: t('settings.profile.takePhoto'),
          onPress: async () => {
            try {
              await takeAndUploadPhoto(async (storageId: string) => {
                if (!storageId) {
                  throw new Error(t('errors.noStorageId'));
                }
                await updateProfileImage({ storageId: storageId as any });
                return storageId;
              });
            } catch (error) {
              console.error('Error taking photo:', error);
              Alert.alert(t('errors.uploadFailed'), t('errors.failedToUploadPhoto'));
            }
          }
        },
        {
          text: t('settings.profile.chooseFromLibrary'),
          onPress: async () => {
            try {
              await pickAndUploadImage(async (storageId: string) => {
                if (!storageId) {
                  throw new Error(t('errors.noStorageId'));
                }
                await updateProfileImage({ storageId: storageId as any });
                return storageId;
              });
            } catch (error) {
              console.error('Error picking image:', error);
              Alert.alert(t('errors.uploadFailed'), t('errors.failedToUploadImage'));
            }
          }
        },
        ...(profileImageUrl ? [{
          text: t('settings.profile.removePhoto'),
          style: 'destructive' as const,
          onPress: async () => {
            try {
              await removeProfileImage({});
            } catch (error) {
              console.error('Error removing profile image:', error);
              Alert.alert(t('common.error'), t('errors.failedToRemoveImage'));
            }
          }
        }] : []),
        { text: t('common.cancel'), style: 'cancel' }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.signOut'),
      t('auth.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.signOut'),
          style: 'destructive',
          onPress: async () => {
            // No manual navigation needed - conditional screen rendering
            // automatically shows Landing when auth state changes
            await logout();
          }
        }
      ]
    );
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
      buyCardSubtitle: t('subscription.creditsPerMonth', { credits: subscription.creditAmount }),
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
  }, [subscription, t]);

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
      <StackScreenHeader title={t('settings.title')} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* New Header Design */}
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] || 'there'}!</Text>
          <View style={styles.avatarRow}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              disabled={status !== "idle"}
            >
              {profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <CameraIcon
                    size={24}
                    color={theme.colors.zinc[400]}
                  />
                </View>
              )}
            </TouchableOpacity>

          </View>
        </View>

        {/* Profile Image Moderation Alerts - Full Width */}
        {isPending && (
          <View style={styles.pendingNotice}>
            <Text style={styles.pendingText}>Your profile image is being reviewed...</Text>
          </View>
        )}

        {statusMessage && isRejected && (
          <View style={styles.rejectionNotice}>
            <Text style={styles.rejectionText}>{statusMessage}</Text>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={async () => {
                try {
                  await removeProfileImage({});
                } catch (error) {
                  console.error('Error dismissing image:', error);
                  Alert.alert('Error', 'Failed to dismiss image. Please try again.');
                }
              }}
            >
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Membership Card */}
        <MembershipCard
          creditBalance={creditBalance?.balance ?? 0}
          expiringCredits={expiringCredits?.expiringCredits}
          daysUntilExpiry={expiringCredits?.daysUntilExpiry}
          subscriptionStatus={subscriptionCopy.membershipCardStatus}
          subscription={subscription}
        />

        {/* Manage Credits Section */}
        <SettingsHeader title={t('credits.manageCredits')} />
        <SettingsGroup>
          <SettingsRow
            title={t('subscription.title')}
            renderSubtitle={() => {
              const isActive = subscription?.status === 'active';
              const isCanceling = Boolean(subscription?.cancelAtPeriodEnd);
              const isPaused = subscription?.status === 'unpaid' || subscription?.status === 'past_due';

              if (isActive && !isCanceling) {
                return (
                  <View style={styles.subtitleRow}>
                    <View style={[styles.statusDot, styles.statusDotActive]} />
                    <Text style={styles.subtitleText}>
                      {t('subscription.creditsPerMonth', { credits: subscription.creditAmount })}
                    </Text>
                  </View>
                );
              } else if (isPaused || isCanceling) {
                return (
                  <View style={styles.subtitleRow}>
                    <View style={[styles.statusDot, styles.statusDotInactive]} />
                    <Text style={styles.subtitleText}>{t('subscription.paused')}</Text>
                  </View>
                );
              } else {
                return (
                  <View style={styles.subtitleRow}>
                    <View style={[styles.statusDot, styles.statusDotInactive]} />
                    <Text style={styles.subtitleText}>{t('subscription.inactive')}</Text>
                  </View>
                );
              }
            }}
            renderRightSide={() => {
              const isActive = subscription?.status === 'active';
              const isCanceling = Boolean(subscription?.cancelAtPeriodEnd);
              const isPaused = subscription?.status === 'unpaid' || subscription?.status === 'past_due';

              let buttonText = t('settings.subscription.startSubscription');
              if (isActive && !isCanceling) {
                buttonText = t('common.update');
              } else if (isPaused || isCanceling) {
                buttonText = t('subscription.resume');
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
          <SettingsRow
            title={t('credits.quickBuy')}
            subtitle={t('credits.quickBuySubtitle')}
            renderRightSide={() => (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleOpenCreditsSheet}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>{t('credits.buyCreditsButton')}</Text>
              </TouchableOpacity>
            )}
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
        <SettingsHeader title={t('settings.title')} />
        <SettingsGroup>
          <SettingsRow
            title={t('bookings.myBookings')}
            subtitle={t('bookings.myBookingsSubtitle')}
            onPress={() => navigation.navigate('Bookings' as never)}
            icon={TicketIcon}
          />
          <SettingsRow
            title={t('settings.city.title')}
            subtitle={cityLabel || t('settings.city.notSet')}
            onPress={() => navigation.navigate('CitySelection' as never)}
            icon={MapPinIcon}
          />
          <SettingsRow
            title={t('settings.account.appLanguage')}
            subtitle={getLanguageDisplay(i18n.language)}
            onPress={() => navigation.navigate('LanguageSelection' as never)}
            icon={LanguagesIcon}
          />
          <SettingsRow
            title={t('settings.notifications.title')}
            subtitle={t('settings.notifications.notificationsSubtitle')}
            onPress={() => navigation.navigate('SettingsNotifications')}
            icon={BellIcon}
          />
          <SettingsRow
            title={t('settings.account.accountSettings')}
            subtitle={t('settings.account.accountSettingsSubtitle')}
            onPress={() => navigation.navigate('SettingsAccount')}
            icon={ShieldIcon}
          />
        </SettingsGroup>

        {/* Account Actions */}
        <SettingsHeader title={t('settings.account.title')} />
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
              <Text style={styles.logoutText}>{t('auth.signOut')}</Text>
            </View>
          </TouchableOpacity>
        </SettingsGroup>
      </ScrollView>

      <QuickBuyCreditsSheet
        ref={creditsSheetRef}
        snapPoints={creditsSnapPoints}
        onChange={handleSheetChange}
      />
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
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.zinc[200],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.zinc[300],
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

  // Profile image moderation styles
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingNotice: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.sky[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.sky[200],
  },
  pendingText: {
    color: theme.colors.sky[700],
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  rejectionNotice: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.rose[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.rose[200],
  },
  rejectionText: {
    color: theme.colors.rose[700],
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  dismissButton: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.zinc[200],
    borderRadius: 8,
    alignSelf: 'center',
    minWidth: 100,
  },
  dismissButtonText: {
    color: theme.colors.zinc[800],
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
});
