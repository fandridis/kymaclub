import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { XCircle, ArrowLeft } from 'lucide-react-native';
import { theme } from '../../theme';
import { useTypedTranslation } from '../../i18n/typed';

/**
 * PaymentCancelScreen - Legacy screen for web redirect flows
 * 
 * Note: Most payments now use the in-app Stripe Payment Sheet,
 * which handles cancellation directly. This screen is kept
 * for backwards compatibility with any existing deep links.
 */
export function PaymentCancelScreen() {
  const navigation = useNavigation();
  const { t } = useTypedTranslation();

  const handleGoBack = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'News' as never }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <XCircle size={80} color={theme.colors.rose[500]} strokeWidth={1.5} />

        <Text style={styles.title}>{t('payment.cancelled')}</Text>
        <Text style={styles.message}>{t('payment.cancelledMessage')}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoBack}>
            <ArrowLeft size={20} color={theme.colors.zinc[600]} />
            <Text style={styles.secondaryButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
    gap: 8,
  },
  secondaryButtonText: {
    color: theme.colors.zinc[600],
    fontSize: 16,
    fontWeight: '500',
  },
});
