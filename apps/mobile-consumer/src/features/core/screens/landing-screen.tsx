// components/landing-screen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation';
import { useTypedTranslation } from '../../../i18n/typed';
import { theme } from '../../../theme';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

export function LandingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTypedTranslation();
  const { user } = useCurrentUser();


  useEffect(() => {
    if (user) {
      const redirectTo = user.hasConsumerOnboarded ? 'News' : 'Onboarding';
      // Reset the entire navigation stack and navigate to the next screen without history
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: redirectTo }],
        })
      );
    }
  }, [user, navigation])


  const handleSignIn = () => {
    navigation.navigate('SignInModal');
  };

  const handleCreateAccount = () => {
    navigation.navigate('CreateAccountModal', {
      waitlistData: {
        userLocation: null,
        serviceAreaCheck: null,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>{t('auth.landing.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.landing.subtitle')}</Text>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleCreateAccount}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>{t('auth.landing.createAccount')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSignIn}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>{t('auth.landing.signIn')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t('auth.landing.footer')}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.xl,
  },
  headerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing['5xl'],
  },
  bottomSection: {
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize['4xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.zinc[900],
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.zinc[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonSection: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  button: {
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: theme.colors.emerald[600],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: theme.colors.zinc[300],
  },
  secondaryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.zinc[500],
  },
});