// landing-screen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation';
import { useTypedTranslation } from '../../../i18n/typed';
import { theme } from '../../../theme';
import { HeaderLanguageSwitcher } from '../../../components/HeaderLanguageSwitcher';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

/**
 * Landing Screen - Entry point for unauthenticated users
 * 
 * No manual redirect logic needed - conditional screen rendering handles navigation:
 * - This screen is only shown in the unauthenticated group
 * - When user authenticates, the screen automatically disappears
 * - The appropriate screen (Onboarding or News) is shown automatically
 */
export function LandingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTypedTranslation();

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

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header Row with Language Switcher */}
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <HeaderLanguageSwitcher />
        </View>

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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
