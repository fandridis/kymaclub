// components/landing-screen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { RootStackParamList } from '../../../navigation';
import { useAuth } from '../../../stores/auth-store';
import { secureStorage } from '../../../utils/storage';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

export function LandingScreen() {
  const navigation = useNavigation<NavigationProp>();
  // const isAuthenticated = secureStorage.getIsAuthenticated();
  const { user } = useAuth();
  const isReallyAuthenticated = user; //  && isAuthenticated;

  useEffect(() => {
    if (isReallyAuthenticated) {
      // Reset the entire navigation stack and navigate to Home without history
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    }
  }, [user, navigation, isReallyAuthenticated])


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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.logo}>🌊</Text>
            <Text style={styles.title}>KymaClub</Text>
            <Text style={styles.subtitle}>Your premium beach experience</Text>
          </View>

          <View style={styles.featuresSection}>
            <BlurView intensity={20} tint="light" style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🏖️</Text>
              <Text style={styles.featureTitle}>1. Select your credits.</Text>
            </BlurView>

            <BlurView intensity={20} tint="light" style={styles.featureCard}>
              <Text style={styles.featureEmoji}>📱</Text>
              <Text style={styles.featureTitle}>2. Choose your superpowers!</Text>
            </BlurView>

            <BlurView intensity={20} tint="light" style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🍹</Text>
              <Text style={styles.featureTitle}>3. Browser & Book your spot!</Text>
            </BlurView>
          </View>

          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Currently serving Athens and surrounding areas
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  featuresSection: {
    gap: 16,
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  buttonSection: {
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
});