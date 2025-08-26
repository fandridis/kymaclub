import React, { useState } from 'react';
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

  // Get user booking statistics (mock data for now - we'll need to implement this query)
  const bookingStats = {
    thisMonth: 12,
    allTime: 45
  };

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
    const nextBilling = new Date(subscription.currentPeriodEnd);
    const formatter = new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    // If subscription is set to cancel at period end, show cancellation message
    if (subscription.cancelAtPeriodEnd) {
      return `${subscription.creditAmount} credits/month • Subscription will end on ${formatter.format(nextBilling)}`;
    }
    
    return `${subscription.creditAmount} credits/month • Next billing: ${formatter.format(nextBilling)}`;
  };

  const isSubscriptionActive = () => {
    return subscription && subscription.status === 'active';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        {/* User Avatar Section */}
        <View style={styles.avatarSection}>
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
                size={20}
                color={status !== "idle" ? theme.colors.zinc[400] : "#fff"}
              />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {status !== "idle" && (
            <Text style={styles.uploadStatus}>
              {status === "preparing" ? "Preparing..." : "Uploading..."}
            </Text>
          )}
        </View>

        {/* Statistics Section */}
        <SettingsGroup>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{bookingStats.thisMonth}</Text>
              <Text style={styles.statLabel}>Classes this month</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{bookingStats.allTime}</Text>
              <Text style={styles.statLabel}>Classes all-time</Text>
            </View>
          </View>
        </SettingsGroup>


        <SettingsGroup>
          <SettingsRow
            title="Credits Balance"
            subtitle={(() => {
              const mockExpiringCredits = 15;
              const mockDaysUntilExpiry = 12;
              if (mockDaysUntilExpiry < 30 && mockExpiringCredits > 0) {
                return `${mockExpiringCredits} credits expire in ${mockDaysUntilExpiry} days`;
              }
              return undefined;
            })()}
            rightElement={
              <View style={styles.creditsBadge}>
                <DiamondIcon size={16} color={theme.colors.emerald[600]} />
                <Text style={styles.creditsBadgeText}>{creditBalance?.balance || 0}</Text>
              </View>
            }
            showChevron={false}
          />
        </SettingsGroup>

        {/* Credits Management */}
        <SettingsHeader title="Credits Management" />
        <SettingsGroup>
          <SettingsRow
            icon={CrownIcon}
            title="Monthly Subscription"
            subtitle={getSubscriptionSubtitle()}
            rightElement={
              <View style={[styles.statusBadge, { backgroundColor: isSubscriptionActive() ? theme.colors.emerald[100] : theme.colors.zinc[100] }]}>
                <Text style={[styles.statusBadgeText, { color: isSubscriptionActive() ? theme.colors.emerald[700] : theme.colors.zinc[600] }]}>
                  {isSubscriptionActive() ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
            }
            onPress={() => navigation.navigate('Subscription')}
            showChevron
          />
          <SettingsRow
            icon={ZapIcon}
            title="Superpowers"
            subtitle="Boost your class bookings with special features"
            rightElement={
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>2</Text>
              </View>
            }
            onPress={() => navigation.navigate('Superpowers')}
            showChevron
          />
          <SettingsRow
            icon={CreditCardIcon}
            title="Buy Credits"
            subtitle="One-time credit packs without subscription"
            onPress={() => navigation.navigate('BuyCredits')}
            showChevron
          />
        </SettingsGroup>


        {/* Settings Navigation */}
        <SettingsHeader title="Settings" />
        <SettingsGroup>
          <SettingsRow
            title="Notifications"
            subtitle="Push notifications, email preferences"
            showChevron
            onPress={() => navigation.navigate('SettingsNotifications')}
            icon={BellIcon}
          />
          <SettingsRow
            title="Account Settings"
            subtitle="Privacy, security, data"
            showChevron
            onPress={() => navigation.navigate('SettingsAccount')}
            icon={ShieldIcon}
          />
        </SettingsGroup>

        {/* Account Actions */}
        <SettingsHeader title="Account" />
        <SettingsGroup>
          <SettingsRow
            icon={LogOutIcon}
            title="Sign Out"
            subtitle="Sign out of your account"
            titleStyle={{ color: theme.colors.rose[500] }}
            iconColor={theme.colors.rose[500]}
            onPress={handleLogout}
            showChevron={false}
          />
        </SettingsGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.black,
    color: theme.colors.zinc[900],
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 0,
    borderRadius: 0,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.emerald[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
    marginBottom: 4,
  },
  userEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[600],
  },
  uploadStatus: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.emerald[600],
    marginTop: 4,
    fontWeight: theme.fontWeight.medium,
  },
  avatarOverlayLoading: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.zinc[200],
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.emerald[600],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[600],
    textAlign: 'center',
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
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.emerald[50],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  creditsBadgeText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.emerald[700],
    marginLeft: 4,
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
    color: theme.colors.sky[700],
  },
});