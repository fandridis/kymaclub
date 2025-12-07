import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { LinearGradient } from 'expo-linear-gradient';
import ReAnimated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';

import { theme } from '../../theme';
import { SwipeToConfirmButton } from '../../components/SwipeToConfirmButton';
import { useTypedTranslation } from '../../i18n/typed';
import type { RootStackParamList } from '../index';

const GREECE_TZ = 'Europe/Athens';

const RAINBOW_COLORS = [
  '#FF6B6B',
  '#F97316',
  '#FACC15',
  '#4ADE80',
  '#22D3EE',
  '#60A5FA',
  '#A855F7',
  '#F472B6',
  '#FF6B6B',
] as const;

const AnimatedLinearGradient = ReAnimated.createAnimatedComponent(LinearGradient);

type TicketStatusVariant = 'confirmed' | 'waitlist' | 'cancelled' | 'neutral';

type BookingTicketModalScreenProps = NativeStackScreenProps<RootStackParamList, 'BookingTicketModal'>;

export function BookingTicketModalScreen({ navigation, route }: BookingTicketModalScreenProps) {
  const insets = useSafeAreaInsets();
  const booking = route.params?.booking;
  const rotation = useSharedValue(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTypedTranslation();

  const completeBookingMutation = useMutation(api.mutations.bookings.completeBooking);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleConfirm = useCallback(async () => {
    if (!booking?._id || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await completeBookingMutation({ bookingId: booking._id });

      Alert.alert(
        t('ticket.checkInConfirmed'),
        t('ticket.checkInSuccessMessage'),
        [
          {
            text: t('common.ok'),
            style: 'default',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to complete booking:', error);

      // Handle specific error messages from the backend
      const errorMessage = error?.data?.message || error?.message || t('errors.unexpectedError');

      let title = t('ticket.checkInFailed');
      let message = t('ticket.checkInErrorMessage');

      if (errorMessage.includes('Too early to check in')) {
        title = t('ticket.tooEarly');
        message = t('ticket.tooEarlyMessage');
      } else if (errorMessage.includes('Check-in window has closed')) {
        title = t('ticket.checkInClosed');
        message = t('ticket.checkInClosedMessage');
      } else if (errorMessage.includes('Cannot complete booking')) {
        title = t('ticket.alreadyProcessed');
        message = t('ticket.alreadyProcessedMessage');
      }

      Alert.alert(title, message, [{ text: t('common.ok'), style: 'default' }]);
    } finally {
      setIsSubmitting(false);
    }
  }, [booking?._id, isSubmitting, completeBookingMutation, navigation, t]);

  const safeBottomPadding = Math.max(insets.bottom, 16);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => {
      cancelAnimation(rotation);
      rotation.value = 0;
    };
  }, [rotation]);

  const rainbowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!booking) {
    return (
      <View style={[styles.screen, { paddingBottom: safeBottomPadding }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('ticket.title')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X color={theme.colors.zinc[800]} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.missingContainer}>
          <Text style={styles.missingTitle}>{t('ticket.bookingUnavailable')}</Text>
          <Text style={styles.missingText}>{t('ticket.bookingUnavailableMessage')}</Text>
        </View>
      </View>
    );
  }

  const className = booking.classInstanceSnapshot?.name ?? t('classes.title');
  const instructorName = booking.classInstanceSnapshot?.instructor ?? t('classes.instructor');
  const venueName = booking.venueSnapshot?.name ?? t('venues.venue');

  const startTimeValue = booking.classInstanceSnapshot?.startTime;
  const startDate = startTimeValue ? new Date(startTimeValue) : null;

  let formattedDate = t('ticket.tbd');
  let formattedTime = t('ticket.tbd');

  if (startDate) {
    try {
      formattedDate = format(startDate, 'MMM d', { in: tz(GREECE_TZ) });
    } catch (e) {
      console.warn('Error formatting date with tz:', e);
      formattedDate = format(startDate, 'MMM d');
    }

    try {
      formattedTime = format(startDate, 'HH:mm', { in: tz(GREECE_TZ) });
    } catch (e) {
      console.warn('Error formatting time with tz:', e);
      formattedTime = format(startDate, 'HH:mm');
    }
  }

  const statusVariant = useMemo<TicketStatusVariant>(() => {
    if (!booking.status) {
      return 'neutral';
    }

    if (booking.status.includes('cancelled')) {
      return 'cancelled';
    }

    if (booking.status.includes('waitlist')) {
      return 'waitlist';
    }

    if (booking.status === 'pending' || booking.status === 'completed') {
      return 'confirmed';
    }

    return 'neutral';
  }, [booking.status]);

  const statusLabel = useMemo(() => {
    if (!booking.status) {
      return t('ticket.status').toUpperCase();
    }

    if (booking.status === 'pending') {
      return t('ticket.confirmed').toUpperCase();
    }

    if (booking.status.includes('cancelled')) {
      return t('ticket.cancelled').toUpperCase();
    }

    if (booking.status.includes('waitlist')) {
      return t('ticket.waitlist').toUpperCase();
    }

    return booking.status.replace(/_/g, ' ').toUpperCase();
  }, [booking.status, t]);

  const formatTimeUntil = useCallback((milliseconds: number): string => {
    const totalMinutes = Math.ceil(milliseconds / (60 * 1000));

    if (totalMinutes < 1) {
      return t('ticket.lessThanMinute');
    }

    if (totalMinutes < 60) {
      return t('ticket.minutes', { count: totalMinutes });
    }

    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];

    if (days > 0) {
      parts.push(t('ticket.days', { count: days }));
    }

    if (hours > 0) {
      parts.push(t('ticket.hours', { count: hours }));
    }

    if (minutes > 0 || parts.length === 0) {
      parts.push(t('ticket.minutes', { count: minutes }));
    }

    return parts.join(', ');
  }, [t]);

  const checkInWindowInfo = useMemo(() => {
    const now = Date.now();
    const classStartTime = booking.classInstanceSnapshot?.startTime;

    if (!classStartTime) {
      return { isInWindow: false, buttonText: t('ticket.checkInUnavailable') };
    }

    const thirtyMinutesInMs = 30 * 60 * 1000;
    const threeHoursInMs = 3 * 60 * 60 * 1000;
    const earliestCheckIn = classStartTime - thirtyMinutesInMs;
    const latestCheckIn = classStartTime + threeHoursInMs;

    if (now < earliestCheckIn) {
      const timeUntilOpen = earliestCheckIn - now;
      const formattedTime = formatTimeUntil(timeUntilOpen);
      return {
        isInWindow: false,
        buttonText: t('ticket.opensIn', { time: formattedTime })
      };
    }

    if (now > latestCheckIn) {
      return {
        isInWindow: false,
        buttonText: t('ticket.checkInClosed')
      };
    }

    return {
      isInWindow: true,
      buttonText: t('ticket.dragToCheckIn')
    };
  }, [booking.classInstanceSnapshot?.startTime, formatTimeUntil, t]);

  const isSwipeDisabled = booking.status !== 'pending' || !checkInWindowInfo.isInWindow;

  return (
    <View style={[styles.screen, { paddingBottom: safeBottomPadding }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('ticket.title')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X color={theme.colors.zinc[800]} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.ticketWrapper}>
          <View style={styles.ticketBorderShell}>
            <AnimatedLinearGradient
              colors={RAINBOW_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, styles.rainbowBorder, rainbowStyle]}
            />

            <View style={styles.ticketInner}>
              <View style={styles.ticketMainBody}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketHeaderTitle}>{className}</Text>
                  <Text style={styles.businessName}>{venueName}</Text>
                </View>

                <View style={styles.ticketContent}>
                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>{t('classes.instructor')}</Text>
                    <Text style={styles.infoText}>{instructorName}</Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>{t('ticket.dateTime')}</Text>
                    <Text style={styles.infoText}>{formattedDate} • {formattedTime}</Text>
                  </View>

                  <View style={styles.attendeeSection}>
                    <Text style={styles.attendeeLabel}>{t('ticket.attendee').toUpperCase()}</Text>
                    <Text style={styles.attendeeName}>
                      {booking.userSnapshot?.name ?? t('ticket.member')}
                    </Text>
                  </View>

                  {/* Questionnaire Answers Section */}
                  {booking.questionnaireAnswers && booking.questionnaireAnswers.answers.length > 0 && (
                    <View style={styles.questionnaireSection}>
                      <Text style={styles.infoLabel}>{t('questionnaire.yourAnswers')}</Text>
                      {booking.questionnaireAnswers.answers.map((answer, index) => {
                        const question = booking.questionnaireAnswers?.questionnaire.find(
                          (q) => q.id === answer.questionId
                        );
                        if (!question) return null;

                        let answerText = '';
                        if (answer.booleanAnswer !== undefined) {
                          answerText = answer.booleanAnswer ? t('questionnaire.yes') : t('questionnaire.no');
                        } else if (answer.singleSelectAnswer) {
                          const option = question.options?.find((o) => o.id === answer.singleSelectAnswer);
                          answerText = option?.label || answer.singleSelectAnswer;
                        } else if (answer.multiSelectAnswer && answer.multiSelectAnswer.length > 0) {
                          answerText = answer.multiSelectAnswer
                            .map((id) => question.options?.find((o) => o.id === id)?.label || id)
                            .join(', ');
                        } else if (answer.numberAnswer !== undefined) {
                          answerText = String(answer.numberAnswer);
                        } else if (answer.textAnswer) {
                          answerText = answer.textAnswer;
                        }

                        return (
                          <View key={question.id} style={styles.questionnaireItem}>
                            <Text style={styles.questionnaireQuestion}>{question.question}</Text>
                            <Text style={styles.questionnaireAnswer}>{answerText}</Text>
                            {answer.feeApplied > 0 && (
                              <Text style={styles.questionnaireFee}>+€{(answer.feeApplied / 100).toFixed(2)}</Text>
                            )}
                          </View>
                        );
                      })}
                      {booking.questionnaireAnswers.totalFees > 0 && (
                        <View style={styles.questionnaireTotalFees}>
                          <Text style={styles.questionnaireTotalLabel}>{t('questionnaire.additionalFees')}:</Text>
                          <Text style={styles.questionnaireTotalValue}>
                            +€{(booking.questionnaireAnswers.totalFees / 100).toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.perforatedEdge}>
                <View style={styles.dashedLine} />
                <View style={[styles.circularCutout, styles.leftCutout]} />
                <View style={[styles.circularCutout, styles.rightCutout]} />
              </View>

              <View style={styles.ticketStub}>
                <View style={styles.stubContent}>
                  <View style={styles.stubLeft}>
                    <Text style={styles.stubTitle}>{className}</Text>
                    <Text style={styles.stubDateTime}>{formattedDate} • {formattedTime}</Text>
                  </View>
                  <View style={styles.stubRight}>
                    <Text style={styles.stubName}>
                      {booking.userSnapshot?.name ?? t('ticket.member')}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        statusVariant === 'confirmed' && styles.statusConfirmed,
                        statusVariant === 'waitlist' && styles.statusWaitlist,
                        statusVariant === 'cancelled' && styles.statusCancelled,
                      ]}
                    >
                      <Text style={styles.statusText}>{statusLabel}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <SwipeToConfirmButton
          label={isSubmitting ? t('ticket.checkingIn') : checkInWindowInfo.buttonText}
          onConfirm={handleConfirm}
          disabled={isSwipeDisabled || isSubmitting}
        />
        <Text style={styles.footerHelpText}>
          {t('ticket.dragToVerify')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  closeButton: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  ticketWrapper: {
    marginBottom: 24,
    borderRadius: 28,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  ticketBorderShell: {
    position: 'relative',
    borderRadius: 28,
    padding: 3,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  rainbowBorder: {
    borderRadius: 28,
  },
  ticketInner: {
    borderRadius: 24,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  ticketMainBody: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  ticketHeader: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    alignItems: 'center',
  },
  ticketHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.zinc[800],
    textAlign: 'center',
  },
  businessName: {
    marginTop: 6,
    fontSize: 16,
    color: theme.colors.zinc[500],
    textAlign: 'center',
  },
  ticketContent: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    gap: 18,
  },
  infoSection: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: theme.colors.zinc[500],
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.zinc[800],
  },
  attendeeSection: {
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: theme.colors.zinc[300],
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  attendeeLabel: {
    fontSize: 10,
    color: theme.colors.zinc[500],
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  attendeeName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.zinc[900],
    textAlign: 'center',
  },
  perforatedEdge: {
    position: 'relative',
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dashedLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#d4d4d8',
  },
  circularCutout: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f9fafb',
    top: '50%',
    marginTop: -9,
  },
  leftCutout: {
    left: -9,
  },
  rightCutout: {
    right: -9,
  },
  ticketStub: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#fff',
  },
  stubContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  stubLeft: {
    flex: 1,
  },
  stubTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    marginBottom: 4,
  },
  stubDateTime: {
    fontSize: 13,
    color: theme.colors.zinc[500],
  },
  stubRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stubName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.zinc[800],
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.zinc[200],
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.zinc[800],
  },
  statusConfirmed: {
    backgroundColor: theme.colors.emerald[400],
  },
  statusWaitlist: {
    backgroundColor: theme.colors.amber[400],
  },
  statusCancelled: {
    backgroundColor: theme.colors.rose[400],
  },
  footer: {
    marginTop: 16,
    gap: 12,
  },
  footerHelpText: {
    fontSize: 13,
    color: theme.colors.zinc[500],
    textAlign: 'center',
  },
  missingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.zinc[800],
  },
  missingText: {
    fontSize: 14,
    color: theme.colors.zinc[500],
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  // Questionnaire styles
  questionnaireSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.zinc[200],
  },
  questionnaireItem: {
    marginTop: 8,
    padding: 12,
    backgroundColor: theme.colors.zinc[50],
    borderRadius: 8,
  },
  questionnaireQuestion: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.zinc[600],
    marginBottom: 4,
  },
  questionnaireAnswer: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.zinc[800],
  },
  questionnaireFee: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.amber[600],
    marginTop: 4,
  },
  questionnaireTotalFees: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.zinc[200],
  },
  questionnaireTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.zinc[600],
  },
  questionnaireTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.amber[600],
  },
});
