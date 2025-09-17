// App.tsx - Clean implementation with modal auth flows
import { Assets as NavigationAssets } from '@react-navigation/elements';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import i18n from './i18n';
import { useEffect, useState } from 'react';
import { useAuth, useAuthStore } from './stores/auth-store';
import { AuthSync } from './features/core/components/auth-sync';
import { AuthGuard } from './features/core/components/auth-guard';
import { ErrorBoundary } from './components/error-boundary';
import { convexAuthStorage } from './utils/storage';
import { RootNavigator } from './navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingWizard from './components/OnboardingWizard';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '@repo/api/convex/_generated/api';
import { parseDeepLink } from '@repo/api/utils/deep-linking';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Create navigation reference for deep linking
const navigationRef = createNavigationContainerRef();

/**
 * Check if a route requires authentication
 */
function needsAuthentication(route: string): boolean {
  const protectedRoutes = [
    'ClassDetailsModal',
    'Home',
    'Settings',
    'SettingsProfile',
    'SettingsNotifications',
    'SettingsSubscription',
    'SettingsAccount',
    'VenueDetailsScreen',
    'QRScannerModal',
    'PaymentSuccess',
    'PaymentCancel',
    'Conversation',
  ];

  return protectedRoutes.includes(route);
}

// Configure how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Preload assets
Asset.loadAsync([
  ...NavigationAssets,
  require('./assets/newspaper.png'),
  require('./assets/bell.png'),
]);

SplashScreen.preventAutoHideAsync();

export function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <ConvexAuthProvider client={convex} storage={convexAuthStorage}>
          <ConvexQueryCacheProvider expiration={60 * 1000}>
            <AuthSync>
              <AuthGuard>
                <ActionSheetProvider>
                  <SafeAreaProvider>
                    <InnerApp
                      theme={theme}
                      onReady={() => SplashScreen.hideAsync()}
                    />
                  </SafeAreaProvider>
                </ActionSheetProvider>
              </AuthGuard>
            </AuthSync>
          </ConvexQueryCacheProvider>
        </ConvexAuthProvider>
      </ConvexProvider>
    </ErrorBoundary>
  );
}

interface InnerAppProps {
  theme: any;
  onReady: () => void;
}

export function InnerApp({ theme, onReady }: InnerAppProps) {
  const { user } = useAuth();
  const recordPushNotificationToken = useMutation(api.mutations.pushNotifications.recordPushNotificationToken);
  const [appReady, setAppReady] = useState(false);
  const isLoading = user === undefined;

  useEffect(() => {
    if (!user?._id) return;
    if (Platform.OS === 'web' || !Device.isDevice) {
      return;
    }

    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          recordPushNotificationToken({ token });
        }
      })
      .catch(err => {
        console.error('Push registration failed', err);
      });
  }, [recordPushNotificationToken, user?._id]);

  // Helper: process a notification response and navigate appropriately
  const processNotificationResponse = React.useCallback((response: Notifications.NotificationResponse | null) => {
    if (!response) return;
    const data: any = response.notification.request.content.data;
    const tryNavigate = (route: string, params: any) => {
      if (navigationRef.isReady()) {
        // @ts-expect-error - navigation types are complex with nested navigators
        navigationRef.navigate(route, params);
      } else {
        // Slight delay if nav container isn't ready yet
        setTimeout(() => {
          if (navigationRef.isReady()) {
            // @ts-expect-error - navigation types are complex with nested navigators
            navigationRef.navigate(route, params);
          }
        }, 200);
      }
    };

    // Prefer deepLink when present
    if (data?.deepLink) {
      const parsedLink = parseDeepLink(data.deepLink as string);
      if (parsedLink) {
        if (needsAuthentication(parsedLink.route)) {
          if (user?._id) {
            tryNavigate(parsedLink.route, parsedLink.params);
          } else {
            useAuthStore.getState().setPendingDeepLink(data.deepLink as string);
            tryNavigate('SignInModal', {});
          }
        } else {
          tryNavigate(parsedLink.route, parsedLink.params);
        }
      }
      return;
    }

    // Fallback for older notifications without deepLink (chat only)
    if (data?.type === 'chat_message' && data?.threadId) {
      if (user?._id) {
        tryNavigate('Conversation', {
          threadId: data.threadId,
          venueName: data.venueName,
          venueImage: data.venueImage,
        });
      } else {
        // Construct a deep link so auth guard can handle after sign-in
        const deepLink = `kymaclub://chat/${data.threadId}${data.venueName ? `?venueName=${encodeURIComponent(data.venueName)}` : ''}`;
        useAuthStore.getState().setPendingDeepLink(deepLink);
        tryNavigate('SignInModal', {});
      }
    }
  }, [user?._id]);

  // Handle notification interactions (when user taps on a notification)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      processNotificationResponse(response);
    });

    // Also handle the case when the app is opened from a killed state
    Notifications.getLastNotificationResponseAsync().then(lastResponse => {
      if (lastResponse) {
        processNotificationResponse(lastResponse);
      }
    }).catch(() => { });

    return () => subscription.remove();
  }, [processNotificationResponse]);

  // Handle notification received while app is in foreground
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      // Notification is automatically displayed by the handler we set above
    });

    return () => subscription.remove();
  }, []);

  // Initialize i18n
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, []);

  // Handle splash screen
  useEffect(() => {
    if (!isLoading && !appReady) {
      onReady();
      setAppReady(true);
    }
  }, [isLoading, onReady, appReady]);

  // Show loading screen while determining auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading KymaClub...</Text>
      </View>
    );
  }

  // Show onboarding if user is authenticated but hasn't completed onboarding
  if (user && !user?.hasConsumerOnboarded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <OnboardingWizard />
      </GestureHandlerRootView>
    );
  }

  // Render navigation - it handles auth state internally
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        theme={theme}
        linking={{
          enabled: true,
          prefixes: ['kymaclub://', 'https://kymaclub.com', 'https://*.kymaclub.com'],
          config: {
            screens: {
              Landing: 'welcome',
              SignInModal: 'signin',
              CreateAccountModal: 'signup',
              Home: {
                path: 'home',
                screens: {
                  News: 'news',
                  Explore: 'explore',
                  Bookings: 'bookings',
                  Messages: 'messages',
                },
              },
              Conversation: {
                path: 'chat/:threadId',
                parse: {
                  threadId: (id: string) => id,
                  venueName: (v: string) => decodeURIComponent(v.replace(/\+/g, ' ')),
                  venueImage: (v: string) => v,
                },
              },
              // Modal screens with parameters
              ClassDetailsModal: {
                path: 'class/:classInstanceId',
                parse: {
                  classInstanceId: (id: string) => id,
                },
              },
              VenueDetailsScreen: {
                path: 'venue/:venueId',
                parse: {
                  venueId: (id: string) => id,
                },
              },
              // Settings screens
              SettingsProfile: 'settings/profile',
              SettingsNotifications: 'settings/notifications',
              SettingsSubscription: 'settings/subscription',
              SettingsAccount: 'settings/account',
              QRScannerModal: 'scanner',
              // Payment result screens
              PaymentSuccess: {
                path: 'payment/success',
                parse: {
                  session_id: (session_id: string) => session_id,
                  type: (type: string) => type as 'subscription' | 'purchase',
                },
              },
              PaymentCancel: {
                path: 'payment/cancel',
                parse: {
                  type: (type: string) => type as 'subscription' | 'purchase',
                },
              },
            },
          },
        }}
        onReady={() => { }}
      >
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

/**
 * Utils
 */
function handleRegistrationError(errorMessage: string) {
  console.warn(`[notifications] ${errorMessage}`);
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Platform.OS === 'web') {
    console.info('[notifications] Web platform does not support Expo push tokens');
    return null;
  }

  if (!Device.isDevice) {
    console.info('[notifications] Skipping push registration on a simulator or emulator');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    handleRegistrationError('Permission not granted to get push token for push notification');
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    handleRegistrationError('Project ID not found');
    return null;
  }

  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    return pushTokenString;
  } catch (error: unknown) {
    handleRegistrationError(`Failed to fetch Expo push token: ${error}`);
    return null;
  }
}
