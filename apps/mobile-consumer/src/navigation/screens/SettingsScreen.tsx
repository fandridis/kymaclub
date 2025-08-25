import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BellIcon, CreditCardIcon, ShieldIcon, CameraIcon, LogOutIcon, RefreshCwIcon, DiamondIcon } from 'lucide-react-native';
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

        {/* Credits Section */}
        <SettingsHeader title="Your credits" />
        <SettingsGroup>
          <SettingsRow
            title="Credits & Subscription"
            renderSubtitle={() => (
              <View style={styles.subscriptionStatusContainer}>
                <View style={[styles.statusDot, { backgroundColor: true ? theme.colors.emerald[500] : theme.colors.rose[500] }]} />
                <Text style={styles.subscriptionStatusText}>
                  {true ? 'Active sub: 20 credits/month' : 'Inactive subscription'}
                </Text>
              </View>
            )}
            icon={DiamondIcon}
            showChevron
            onPress={() => navigation.navigate('SettingsCredits')}
            rightElement={
              <View style={styles.creditsContainer}>
                <DiamondIcon size={14} color={theme.colors.emerald[950]} />
                <Text style={styles.creditsValue}>
                  {creditBalance?.balance || 0}
                </Text>
              </View>
            }
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

        {/* Logout Section */}
        <SettingsGroup>
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <View style={styles.logoutContent}>
              <View style={styles.logoutIconContainer}>
                <LogOutIcon size={20} color={theme.colors.rose[500]} />
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
    backgroundColor: theme.colors.zinc[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
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
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.emerald[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  creditsValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.emerald[950],
  },
  subscriptionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subscriptionStatusText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[600],
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
});