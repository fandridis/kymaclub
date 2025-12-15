import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, NavigationProp } from '@react-navigation/native';
import { BellIcon, ShieldIcon, CameraIcon, LogOutIcon, MapPinIcon, LanguagesIcon, TicketIcon, GiftIcon, StarIcon } from 'lucide-react-native';
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

  // Get user profile image URL
  const profileImageUrl = useQuery(api.queries.uploads.getUserProfileImageUrl, { userId: user?._id! });

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

  // Get user points balance
  const pointsBalance = user?.points ?? 0;

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

        {/* Points & Coupons Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsRow}>
            <View style={styles.pointsItem}>
              <StarIcon size={24} color={theme.colors.amber[500]} />
              <Text style={styles.pointsAmount}>{pointsBalance}</Text>
              <Text style={styles.pointsLabel}>{t('points.title')}</Text>
            </View>
          </View>
        </View>

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

  // Points card
  pointsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: theme.colors.amber[50],
    borderWidth: 1,
    borderColor: theme.colors.amber[200],
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pointsItem: {
    alignItems: 'center',
  },
  pointsAmount: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.amber[700],
    marginTop: 8,
  },
  pointsLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.amber[600],
    marginTop: 4,
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
