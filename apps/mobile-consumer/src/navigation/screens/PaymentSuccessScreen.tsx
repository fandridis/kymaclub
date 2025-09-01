import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CheckCircle, CreditCard, Zap } from 'lucide-react-native';
import { Button } from 'react-native';
import { RootStackParamList } from '../index';

type PaymentSuccessRouteProp = RouteProp<RootStackParamList, 'PaymentSuccess'>;

export function PaymentSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute<PaymentSuccessRouteProp>();
  const { session_id, type } = route.params;

  useEffect(() => {
    // TODO: You might want to verify the payment status with your backend here
    // For now, we'll just show the success screen

    // Show success alert
    setTimeout(() => {
      const message = type === 'subscription'
        ? 'Your subscription has been activated successfully!'
        : 'Your credits have been added successfully!';

      Alert.alert(
        'Payment Successful!',
        message,
        [
          {
            text: 'Great!',
            onPress: () => {
              // Navigate to appropriate screen based on payment type
              if (type === 'subscription') {
                navigation.navigate('Home', { screen: 'Settings' });
              } else {
                navigation.navigate('Home', { screen: 'Settings' });
              }
            },
          },
        ]
      );
    }, 1000);
  }, [session_id, type, navigation]);

  const getIcon = () => {
    return type === 'subscription' ? (
      <Zap size={64} color="#22C55E" strokeWidth={1.5} />
    ) : (
      <CreditCard size={64} color="#22C55E" strokeWidth={1.5} />
    );
  };

  const getTitle = () => {
    return type === 'subscription' ? 'Subscription Activated!' : 'Credits Added!';
  };

  const getMessage = () => {
    return type === 'subscription'
      ? 'Your monthly subscription is now active. Credits will be added to your account.'
      : 'Your credits have been successfully added to your account.';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CheckCircle size={80} color="#22C55E" strokeWidth={1.5} />
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>

        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.message}>{getMessage()}</Text>

        <View style={styles.details}>
          <Text style={styles.sessionId}>Session: {session_id}</Text>
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
  iconContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  details: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 24,
  },
  sessionId: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
});