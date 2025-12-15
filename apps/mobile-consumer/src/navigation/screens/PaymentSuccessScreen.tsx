import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { CheckCircle } from 'lucide-react-native';
import { theme } from '../../theme';
import { useTypedTranslation } from '../../i18n/typed';

/**
 * PaymentSuccessScreen - Legacy screen for web redirect flows
 * 
 * Note: Most payments now use the in-app Stripe Payment Sheet,
 * which handles success/failure directly. This screen is kept
 * for backwards compatibility with any existing deep links.
 */
export function PaymentSuccessScreen() {
  const navigation = useNavigation();
  const { t } = useTypedTranslation();

  useEffect(() => {
    // Show success alert and navigate to bookings
    setTimeout(() => {
      Alert.alert(
        t('payment.success'),
        t('payment.bookingConfirmed'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // Navigate to Bookings to see the new booking
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Bookings' }],
                })
              );
            },
          },
        ]
      );
    }, 500);
  }, [navigation, t]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CheckCircle size={80} color={theme.colors.emerald[500]} strokeWidth={1.5} />

        <Text style={styles.title}>{t('payment.success')}</Text>
        <Text style={styles.message}>{t('payment.bookingConfirmed')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
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
    color: theme.colors.zinc[900],
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: theme.colors.zinc[600],
    textAlign: 'center',
    lineHeight: 24,
  },
});
