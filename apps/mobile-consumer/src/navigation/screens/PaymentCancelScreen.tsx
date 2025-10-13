import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { XCircle, ArrowLeft } from 'lucide-react-native';
import { RootStackParamList } from '../index';

type PaymentCancelRouteProp = RouteProp<RootStackParamList, 'PaymentCancel'>;

export function PaymentCancelScreen() {
  const navigation = useNavigation();
  const route = useRoute<PaymentCancelRouteProp>();
  const { type } = route.params;

  // const handleTryAgain = () => {
  //   if (type === 'subscription') {
  //     navigation.navigate('Subscription');
  //   } else {
  //     navigation.navigate('BuyCredits');
  //   }
  // };

  const handleGoBack = () => {
    // Navigate to home tab first, then to settings, replacing the navigation history
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Home' },
        { name: 'Settings' }
      ],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <XCircle size={80} color="#EF4444" strokeWidth={1.5} />

        <Text style={styles.title}>Payment Cancelled</Text>
        <Text style={styles.message}>
          Your {type === 'subscription' ? 'subscription' : 'credit purchase'} was cancelled.
          No charges were made to your account.
        </Text>

        <View style={styles.buttonContainer}>
          {/* <TouchableOpacity style={styles.primaryButton} onPress={handleTryAgain}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoBack}>
            <ArrowLeft size={20} color="#6b7280" />
            <Text style={styles.secondaryButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#ff4747',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});