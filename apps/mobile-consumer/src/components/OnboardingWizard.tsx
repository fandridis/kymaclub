import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, TextInput, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { useLogout } from '../hooks/useLogout';
import { getCityOptions } from '@repo/utils/constants';
import { HeaderLanguageSwitcher } from './HeaderLanguageSwitcher';

interface OnboardingData {
  userName?: string;
  city?: string;
}

const CITY_OPTIONS = getCityOptions();


const stepConfig = [
  {
    title: "Welcome to KymaClub! 👋",
    description: "You are just a step away from exploring hundreds of different classes."
  }
];

const THEME = {
  background: '#f8fafc',
  primary: '#3b82f6',
  primaryLight: '#dbeafe',
  text: '#1e293b',
  textSecondary: '#64748b',
  textLight: '#94a3b8',
  white: '#ffffff',
  border: '#e2e8f0',
  success: '#10b981',
  successLight: '#d1fae5',
  shadow: 'rgba(0, 0, 0, 0.1)'
};

export default function OnboardingWizard() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    city: CITY_OPTIONS[0]?.value
  });
  const [currentStep, setCurrentStep] = useState<'name' | 'city'>('name');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const logout = useLogout();

  const completeOnboardingMutation = useMutation(api.mutations.core.completeConsumerOnboarding);

  const handleNext = () => {
    if (currentStep === 'name') {
      setCurrentStep('city');
    }
  };

  const handleFinish = async () => {
    if (isSubmitting) return;

    // Validate city is selected
    if (!onboardingData.city) {
      Alert.alert('Error', 'Please select a city');
      return;
    }

    try {
      setIsSubmitting(true);

      await completeOnboardingMutation({
        name: onboardingData.userName?.trim() || undefined,
        city: onboardingData.city,
      });

      // No manual navigation needed - conditional screen rendering
      // automatically shows News when hasConsumerOnboarded changes to true

    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert(
        'Error',
        'Failed to complete onboarding. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderNameStep = () => (
    <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
      <Text style={{
        fontSize: 16,
        color: THEME.textSecondary,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 24
      }}>
        How should we call you?
      </Text>
      <TextInput
        style={{
          backgroundColor: THEME.white,
          padding: 20,
          borderRadius: 16,
          fontSize: 18,
          width: '100%',
          maxWidth: 320,
          textAlign: 'center',
          fontWeight: '600',
          borderWidth: 2,
          borderColor: onboardingData.userName ? THEME.primary : THEME.border,
          shadowColor: THEME.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3
        }}
        placeholder="Enter your name"
        placeholderTextColor={THEME.textLight}
        value={onboardingData.userName || ''}
        onChangeText={(text) => setOnboardingData(prev => ({ ...prev, userName: text }))}
      />
    </View>
  );

  const renderCityStep = () => (
    <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
      <Text style={{
        fontSize: 16,
        color: THEME.textSecondary,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 24
      }}>
        Which city do you want to explore classes in?
      </Text>
      <View style={{ width: '100%', maxWidth: 320, gap: 12 }}>
        {CITY_OPTIONS.map((city) => (
          <TouchableOpacity
            key={city.value}
            onPress={() => setOnboardingData(prev => ({ ...prev, city: city.value }))}
            style={{
              backgroundColor: onboardingData.city === city.value ? THEME.primaryLight : THEME.white,
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: onboardingData.city === city.value ? THEME.primary : THEME.border,
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: onboardingData.city === city.value ? THEME.primary : THEME.text,
              textAlign: 'center',
            }}>
              {city.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      {/* Header Row with Language Switcher */}
      <View style={onboardingStyles.headerRow}>
        <View style={onboardingStyles.headerSpacer} />
        <HeaderLanguageSwitcher />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 0 }}>
          {/* Title and Description */}
          <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
            <Text style={{
              fontSize: 28,
              fontWeight: '800',
              color: THEME.text,
              textAlign: 'center',
              marginBottom: 12,
              lineHeight: 34
            }}>
              {stepConfig[0].title}
            </Text>
            <Text style={{
              fontSize: 16,
              color: THEME.textSecondary,
              textAlign: 'center',
              lineHeight: 24
            }}>
              {stepConfig[0].description}
            </Text>
          </View>

          {/* Step Content */}
          <View style={{ flex: 1 }}>
            {currentStep === 'name' ? renderNameStep() : renderCityStep()}
          </View>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={{
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 16,
        backgroundColor: THEME.background,
        borderTopWidth: 1,
        borderTopColor: THEME.border
      }}>
        <View style={{
          alignItems: 'center'
        }}>
          {/* Next/Finish Button */}
          <TouchableOpacity
            onPress={currentStep === 'name' ? handleNext : handleFinish}
            disabled={isSubmitting || (currentStep === 'name' && !onboardingData.userName?.trim()) || (currentStep === 'city' && !onboardingData.city)}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 12,
              backgroundColor: isSubmitting ? THEME.textLight : THEME.primary,
              width: '100%',
              shadowColor: THEME.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isSubmitting ? 0.1 : 0.3,
              shadowRadius: 8,
              elevation: isSubmitting ? 2 : 6,
              marginBottom: 8
            }}
          >
            <Text style={{
              color: THEME.white,
              fontSize: 16,
              fontWeight: '700',
              textAlign: 'center'
            }}>
              {isSubmitting ? 'Completing...' : currentStep === 'name' ? 'Next' : 'Get Started'}
            </Text>
          </TouchableOpacity>

          {currentStep === 'city' && (
            <TouchableOpacity
              onPress={() => setCurrentStep('name')}
              disabled={isSubmitting}
              style={{
                paddingVertical: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: isSubmitting ? THEME.textLight : THEME.textSecondary,
                fontSize: 16,
                fontWeight: '500',
              }}>
                Back
              </Text>
            </TouchableOpacity>
          )}

          {/* Back to Sign In Link */}
          <TouchableOpacity
            onPress={async () => {
              // No manual navigation needed - conditional screen rendering
              // automatically shows Landing when auth state changes
              await logout();
            }}
            disabled={isSubmitting}
            style={{
              paddingVertical: 12,
              alignItems: 'center'
            }}
          >
            <Text style={{
              color: isSubmitting ? THEME.textLight : THEME.textSecondary,
              fontSize: 16,
              fontWeight: '500',
              textDecorationLine: 'underline'
            }}>
              Back to sign in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const onboardingStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerSpacer: {
    flex: 1,
  },
});