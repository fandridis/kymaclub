// App.tsx - Clean implementation with conditional screens and deep link handling
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
import * as Linking from 'expo-linking';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import i18n from './i18n';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ErrorBoundary } from './components/error-boundary';
import { convexAuthStorage } from './utils/storage';
import { RootNavigator } from './navigation';
import { useCurrentUser } from './hooks/useCurrentUser';
import { useStorageSync } from './hooks/useStorageSync';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTypedTranslation } from './i18n/typed';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StripeProvider } from '@stripe/stripe-react-native';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '@repo/api/convex/_generated/api';
import { ConvexAuthProvider } from '@convex-dev/auth/react';


// Grab env values safely from app.config.js → extra
const convexUrl: string | undefined =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error("❌ CRITICAL: Missing EXPO_PUBLIC_CONVEX_URL in app.config.js -> extra");
  console.error("❌ This will cause the app to fail to connect to the backend!");
  console.error("❌ Check your eas.json file and ensure environment variables are configured.");
}

// Use a fallback URL to prevent silent failures (will still fail but more obviously)
const convex = new ConvexReactClient(convexUrl || "https://MISSING_CONVEX_URL.convex.cloud", {
  unsavedChangesWarning: false,
  // verbose: true,
});

// Stripe publishable key for in-app payments
const stripePublishableKeyFromExtra: string | undefined =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Dev-only fallback so local builds work even if env vars weren't injected at bundle time.
// IMPORTANT: Do not rely on this in production; rotate by setting EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY.
const stripePublishableKeyFallback: string | undefined = __DEV__
  ? "pk_test_D6Fdm4YCR6FZApgnZuJo8M2a"
  : undefined;

const stripePublishableKey: string | undefined =
  stripePublishableKeyFromExtra ?? stripePublishableKeyFallback;

if (!stripePublishableKey && !__DEV__) {
  console.error("❌ CRITICAL: Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in app.config.js -> extra");
  console.error("❌ Stripe payments will not work. Configure it in eas.json env or EAS secrets.");
}
// Create navigation reference for deep linking
const navigationRef = createNavigationContainerRef();

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

// Linking prefixes
const LINKING_PREFIXES = ['kymaclub://', 'https://kymaclub.com', 'https://*.kymaclub.com'];

export function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ErrorBoundary>
      <StripeProvider
        publishableKey={stripePublishableKey || ""}
        merchantIdentifier="merchant.com.kymaclub.app"
      >
        <ConvexProvider client={convex}>
          <ConvexAuthProvider client={convex} storage={convexAuthStorage}>
            <SafeAreaProvider>
              <ActionSheetProvider>
                <InnerApp
                  theme={theme}
                  onReady={() => { SplashScreen.hideAsync() }}
                />
              </ActionSheetProvider>
            </SafeAreaProvider>
          </ConvexAuthProvider>
        </ConvexProvider>
      </StripeProvider>
    </ErrorBoundary>
  );
}

interface InnerAppProps {
  theme: any;
  onReady: () => void;
}

/**
 * Hook to track pending deep links for handling after authentication.
 * 
 * This implements the "remount container" approach from React Navigation docs:
 * - Stores incoming deep links when user is not authenticated
 * - Clears the deep link after successful authentication
 * - Passes the stored link via getInitialURL when remounting
 * 
 * Important: We wait for loading to complete before tracking auth state changes
 * to avoid false "just logged in" detection during initial app load.
 */
function usePendingDeepLink(isAuthenticated: boolean, isLoading: boolean) {
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null);
  // null means "not yet initialized" - we only initialize after loading completes
  const wasAuthenticated = useRef<boolean | null>(null);

  // Track auth state changes and clear pending deep link after login
  useEffect(() => {
    // Don't do anything while loading - we don't know the true auth state yet
    if (isLoading) return;

    // Initialize wasAuthenticated only after loading is done
    if (wasAuthenticated.current === null) {
      wasAuthenticated.current = isAuthenticated;
      return;
    }

    // Clear pending deep link after successful authentication
    if (!wasAuthenticated.current && isAuthenticated && pendingDeepLink) {
      // User just logged in - clear the pending link after a brief delay
      // to allow navigation to process it
      const timer = setTimeout(() => {
        setPendingDeepLink(null);
      }, 1000);
      wasAuthenticated.current = isAuthenticated;
      return () => clearTimeout(timer);
    }

    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, isLoading, pendingDeepLink]);

  // Listen for incoming deep links when not authenticated (and not loading)
  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    const subscription = Linking.addEventListener('url', ({ url }) => {
      // Only store authenticated route deep links
      if (isAuthenticatedRoute(url)) {
        setPendingDeepLink(url);
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, isLoading]);

  // Check initial URL after loading completes and user is not authenticated
  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    const checkInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url && isAuthenticatedRoute(url)) {
        setPendingDeepLink(url);
      }
    };
    checkInitialURL();
  }, [isAuthenticated, isLoading]);

  // Custom getInitialURL that returns pending deep link after auth
  const getInitialURL = useCallback(async (): Promise<string | null> => {
    // After logging in, return the pending deep link
    if (isAuthenticated && pendingDeepLink) {
      return pendingDeepLink;
    }
    // Otherwise use default behavior
    return Linking.getInitialURL();
  }, [isAuthenticated, pendingDeepLink]);

  return { pendingDeepLink, getInitialURL };
}

/**
 * Check if a URL corresponds to an authenticated route
 */
function isAuthenticatedRoute(url: string): boolean {
  const authenticatedPaths = [
    '/news', '/explore', '/bookings', '/messages', '/settings',
    '/chat/', '/class/', '/venue/', '/payment/',
  ];
  const path = url.toLowerCase();
  return authenticatedPaths.some(p => path.includes(p));
}

export function InnerApp({ theme, onReady }: InnerAppProps) {
  const { user, isLoading } = useCurrentUser();
  const { t } = useTypedTranslation();
  const recordPushNotificationToken = useMutation(api.mutations.pushNotifications.recordPushNotificationToken);
  const [appReady, setAppReady] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const isAuthenticated = !!user;
  const { getInitialURL } = usePendingDeepLink(isAuthenticated, isLoading);

  // Sync storage cleanup on user changes
  useStorageSync();

  // Add timeout to prevent infinite loading (15 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.error('⚠️ Loading timeout - Convex connection may have failed');
        console.error('⚠️ Check if EXPO_PUBLIC_CONVEX_URL is configured correctly');
        setLoadingTimeout(true);
        onReady(); // Hide splash screen even on timeout
        setAppReady(true);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timer);
  }, [isLoading, onReady]);

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

  /**
   * Process push notification response - simply open the deep link.
   * Navigation container handles routing based on available screens.
   */
  const processNotificationResponse = React.useCallback((response: Notifications.NotificationResponse | null) => {
    if (!response) return;
    const data: any = response.notification.request.content.data;

    if (data?.deepLink) {
      Linking.openURL(data.deepLink as string);
    }
  }, []);

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

  // Show error screen if loading timed out
  if (loadingTimeout) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>⚠️ {t('app.connectionFailed')}</Text>
        <Text style={styles.errorText}>
          {t('app.connectionFailedMessage')}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoadingTimeout(false);
            setAppReady(false);
          }}
        >
          <Text style={styles.retryButtonText}>{t('app.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // Keep splash screen visible while determining auth state
  if (isLoading) {
    return null;
  }

  // Render navigation with key based on auth state
  // This causes remount when auth changes, allowing pending deep links to be processed
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <NavigationContainer
          key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
          ref={navigationRef}
          theme={theme}
          linking={{
            enabled: true,
            prefixes: LINKING_PREFIXES,
            getInitialURL,
            config: {
              screens: {
                Landing: 'welcome',
                SignInModal: 'signin',
                CreateAccountModal: 'signup',
                News: 'news',
                Explore: 'explore',
                Bookings: 'bookings',
                Messages: 'messages',
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
                SettingsNotifications: 'settings/notifications',
                SettingsSubscription: 'settings/subscription',
                SettingsAccount: 'settings/account',
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
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fffffe',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
