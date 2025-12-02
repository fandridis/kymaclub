import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation } from 'convex/react';
import { DiamondIcon, X } from 'lucide-react-native';
import { theme } from '../../theme';
import { QuestionnaireForm } from '../../components/QuestionnaireForm';
import { useTypedTranslation } from '../../i18n/typed';
import type { Question, QuestionAnswer } from '@repo/api/types/questionnaire';
import { calculateTotalQuestionnaireFees, hasAnswerValue } from '@repo/api/operations/questionnaire';
import { api } from '@repo/api/convex/_generated/api';
import { centsToCredits } from '@repo/utils/credits';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import type { RootStackParamList } from '..';

type QuestionnaireModalRoute = RouteProp<RootStackParamList, 'QuestionnaireModal'>;

export function QuestionnaireModalScreen() {
  const { t } = useTypedTranslation();
  const navigation = useNavigation();
  const route = useRoute<QuestionnaireModalRoute>();
  const insets = useSafeAreaInsets();

  const { questions, basePrice, className, classInstanceId } = route.params;

  const bookClass = useMutation(api.mutations.bookings.bookClass);

  const [answers, setAnswers] = useState<Omit<QuestionAnswer, 'feeApplied'>[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate questionnaire fees
  const questionnaireFees = useMemo(() => {
    if (questions.length === 0 || answers.length === 0) return 0;
    return calculateTotalQuestionnaireFees(
      questions,
      answers.map(a => ({ ...a, feeApplied: 0 }))
    );
  }, [questions, answers]);

  // Total price in credits (fees are in cents, basePrice is in credits)
  const questionnaireFeesInCredits = questionnaireFees > 0 ? Math.ceil(centsToCredits(questionnaireFees)) : 0;
  const totalPrice = basePrice + questionnaireFeesInCredits;

  // Check if all required questions are answered
  const allRequiredAnswered = useMemo(() => {
    for (const question of questions) {
      if (!question.required) continue;
      const answer = answers.find(a => a.questionId === question.id);
      if (!answer || !hasAnswerValue({ ...answer, feeApplied: 0 })) {
        return false;
      }
    }
    return true;
  }, [questions, answers]);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await bookClass({
        classInstanceId,
        description: `Booking for ${className}`,
        questionnaireAnswers: answers.length > 0 ? answers : undefined,
      });
      Alert.alert(t('classes.booked'), t('classes.bookedSuccess'));
      navigation.goBack();
    } catch (err: any) {
      const message =
        (err?.data && (err.data.message || err.data.code)) ||
        err?.message ||
        t('classes.bookingFailedMessage');
      Alert.alert(t('classes.bookingFailed'), String(message));
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, bookClass, classInstanceId, className, navigation, t, isSubmitting]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{t('questionnaire.completeBooking')}</Text>
            <Text style={styles.className} numberOfLines={1}>{className}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={theme.colors.zinc[600]} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.instructions}>
            {t('questionnaire.pleaseAnswerQuestions')}
          </Text>

          <QuestionnaireForm
            questions={questions}
            answers={answers}
            onAnswersChange={setAnswers}
            currency="€"
          />

          {/* Extra space at bottom for footer */}
          <View style={{ height: 220 }} />
        </ScrollView>

        {/* Footer - Fixed at bottom */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.pricingContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('questionnaire.classPrice')}</Text>
              <View style={styles.priceValueContainer}>
                <DiamondIcon size={14} color={theme.colors.emerald[600]} />
                <Text style={styles.priceValue}>{basePrice}</Text>
              </View>
            </View>
            {questionnaireFeesInCredits > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('questionnaire.additionalFees')}</Text>
                <View style={styles.priceValueContainer}>
                  <DiamondIcon size={14} color={theme.colors.amber[600]} />
                  <Text style={[styles.priceValue, styles.feeValue]}>
                    +{questionnaireFeesInCredits}
                  </Text>
                </View>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('questionnaire.total')}</Text>
              <View style={styles.priceValueContainer}>
                <DiamondIcon size={16} color={theme.colors.emerald[600]} />
                <Text style={styles.totalValue}>{totalPrice}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!allRequiredAnswered || isSubmitting) && styles.confirmButtonDisabled
            ]}
            onPress={handleConfirm}
            activeOpacity={0.85}
            disabled={!allRequiredAnswered || isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.confirmButtonText, styles.buttonTextWithSpinner]}>
                  {t('questionnaire.booking')}
                </Text>
              </View>
            ) : (
              <Text style={styles.confirmButtonText}>
                {t('questionnaire.confirmBooking', { credits: totalPrice })}
              </Text>
            )}
          </TouchableOpacity>

          {!allRequiredAnswered && (
            <Text style={styles.requiredHint}>
              {t('questionnaire.answerRequired')}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.zinc[100],
    backgroundColor: '#fff',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  className: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[500],
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.zinc[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  instructions: {
    fontSize: theme.fontSize.base,
    color: theme.colors.zinc[600],
    marginBottom: 16,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.zinc[200],
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  pricingContainer: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.zinc[600],
  },
  priceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.zinc[800],
  },
  feeValue: {
    color: theme.colors.amber[600],
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.zinc[200],
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.zinc[900],
  },
  totalValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.emerald[600],
  },
  confirmButton: {
    backgroundColor: theme.colors.emerald[600],
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.zinc[300],
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonTextWithSpinner: {
    marginLeft: 4,
  },
  requiredHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.rose[500],
    textAlign: 'center',
    marginTop: 12,
  },
});

