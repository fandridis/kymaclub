// App.tsx - Clean implementation with modal auth flows
import { Assets as NavigationAssets } from '@react-navigation/elements';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import i18n from './i18n';
import { useEffect, useState } from 'react';
import { useAuth } from './stores/auth-store';
import { AuthSync } from './features/core/components/auth-sync';
import { AuthGuard } from './features/core/components/auth-guard';
import { convexAuthStorage } from './utils/storage';
import { RootNavigator } from './navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import OnboardingWizard from './components/OnboardingWizard';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '@repo/api/convex/_generated/api';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
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
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex} storage={convexAuthStorage}>
        <ConvexQueryCacheProvider>
          <AuthSync>
            <AuthGuard>
              <ActionSheetProvider>
                <InnerApp
                  theme={theme}
                  onReady={() => SplashScreen.hideAsync()}
                />
              </ActionSheetProvider>
            </AuthGuard>
          </AuthSync>
        </ConvexQueryCacheProvider>
      </ConvexAuthProvider>
    </ConvexProvider>
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

    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          recordPushNotificationToken({ token });
        } else {
          console.warn("No push token received");
        }
      })
      .catch(err => {
        console.error("Push registration failed", err);
      });
  }, [user?._id]);

  // Initialize i18n
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      console.log('Language changed to:', lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, []);

  // Handle splash screen
  useEffect(() => {
    if (!isLoading && !appReady) {
      console.log('[App] Auth state determined, hiding splash screen');
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
        theme={theme}
        linking={{
          enabled: true,
          prefixes: ['kymaclub://'],
          config: {
            screens: {
              Landing: 'welcome',
              SignInModal: 'signin',
              CreateAccountModal: 'signup',
              HomeTabs: 'home',
            },
          },
        }}
        onReady={() => {
          console.log('[App] Navigation ready');
        }}
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
  alert(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}