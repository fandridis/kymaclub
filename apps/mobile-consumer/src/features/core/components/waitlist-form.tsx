import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Location from 'expo-location';

interface WaitlistFormProps {
  userLocation: Location.LocationObject | null;
  serviceAreaCheck: any;
  onSubmit: (data: WaitlistData) => void;
  onBack: () => void;
}

export interface WaitlistData {
  email: string;
  selectedCity: string;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  isManualEntry: boolean;
}

const POPULAR_CITIES = [
  'Athens',
  'Thessaloniki',
  'Patra',
  'Heraklion',
  'Larissa',
  'Volos',
  'Ioannina',
  'Kavala',
  'Kalamata',
  'Chania',
  'Other'
];

export function WaitlistForm({ userLocation, serviceAreaCheck, onSubmit, onBack }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError('');
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    if (city !== 'Other') {
      setCustomCity('');
    }
  };

  const handleSubmit = async () => {
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Validate city selection
    const finalCity = selectedCity === 'Other' ? customCity.trim() : selectedCity;
    if (!finalCity) {
      Alert.alert('City Required', 'Please select or enter your city');
      return;
    }

    if (selectedCity === 'Other' && customCity.trim().length < 2) {
      Alert.alert('Invalid City', 'Please enter a valid city name');
      return;
    }

    setIsSubmitting(true);

    try {
      const waitlistData: WaitlistData = {
        email: email.trim(),
        selectedCity: finalCity,
        currentLocation: userLocation ? {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        } : null,
        isManualEntry: !userLocation || !!userLocation.mocked,
      };

      await onSubmit(waitlistData);
    } catch (error) {
      console.error('[WaitlistForm] Error submitting:', error);
      Alert.alert('Error', 'Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDistanceMessage = () => {
    if (!serviceAreaCheck?.nearestArea) {
      return "We're not yet available in your area, but we're expanding!";
    }

    const { nearestArea } = serviceAreaCheck;
    return `Unfortunately, we're not yet available in your area. Join our waitlist and we'll let you know when we reach your area.`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Join Our Waitlist</Text>
              <Text style={styles.subtitle}>
                {getDistanceMessage()}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.formCard}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={[styles.textInput, emailError ? styles.inputError : null]}
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder="your.email@example.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                  />
                  {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                  ) : null}
                </View>

                {/* City Selection */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Your City</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.cityScrollView}
                  >
                    <View style={styles.cityContainer}>
                      {POPULAR_CITIES.map((city) => (
                        <TouchableOpacity
                          key={city}
                          style={[
                            styles.cityChip,
                            selectedCity === city ? styles.cityChipSelected : null
                          ]}
                          onPress={() => handleCitySelect(city)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.cityChipText,
                              selectedCity === city ? styles.cityChipTextSelected : null
                            ]}
                          >
                            {city}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  {selectedCity === 'Other' && (
                    <TextInput
                      style={[styles.textInput, styles.customCityInput]}
                      value={customCity}
                      onChangeText={setCustomCity}
                      placeholder="Enter your city"
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  )}
                </View>

                {/* Benefits */}
                <View style={styles.benefitsContainer}>
                  <Text style={styles.benefitsTitle}>What you'll get:</Text>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🎯</Text>
                    <Text style={styles.benefitText}>Early access when we launch in your city</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🎁</Text>
                    <Text style={styles.benefitText}>Exclusive founding member perks</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  isSubmitting ? styles.submitButtonDisabled : null
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator color="white" style={styles.submitSpinner} />
                    <Text style={styles.submitButtonText}>Joining Waitlist...</Text>
                  </>
                ) : (
                  <Text style={styles.submitButtonText}>Join Waitlist</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={onBack}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Notice */}
            <View style={styles.privacyContainer}>
              <Text style={styles.privacyText}>
                🔒 We respect your privacy. Your email will only be used to notify you about our service availability in your area.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    maxWidth: 350,
    alignSelf: 'center',
    width: '100%',
  },
  icon: {
    fontSize: 36,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    maxWidth: 350,
    alignSelf: 'center',
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#000',
  },
  inputError: {
    borderColor: '#ff4757',
  },
  customCityInput: {
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4757',
    marginTop: 4,
    fontWeight: '500',
  },
  cityScrollView: {
    marginBottom: 8,
  },
  cityContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 24,
  },
  cityChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cityChipSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  cityChipText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  cityChipTextSelected: {
    color: 'white',
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
    maxWidth: 350,
    alignSelf: 'center',
    width: '100%',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitButton: {
    backgroundColor: '#000',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  submitSpinner: {
    marginRight: 8,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  privacyContainer: {
    marginTop: 20,
    paddingHorizontal: 8,
    maxWidth: 350,
    alignSelf: 'center',
    width: '100%',
  },
  privacyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});