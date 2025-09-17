import React, { useCallback, useMemo, useEffect } from 'react';
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

import { theme } from '../../theme';
import { SwipeToConfirmButton } from '../../components/SwipeToConfirmButton';
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

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleConfirm = useCallback(() => {
    Alert.alert(
      'Check-in sent',
      "We let the studio know that you're here. The studio will confirm shortly.",
      [
        {
          text: 'OK',
          style: 'default',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [navigation]);

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
          <Text style={styles.headerTitle}>Booking Ticket</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X color={theme.colors.zinc[800]} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.missingContainer}>
          <Text style={styles.missingTitle}>Booking unavailable</Text>
          <Text style={styles.missingText}>We couldn't find the booking information for this ticket.</Text>
        </View>
      </View>
    );
  }

  const className = booking.classInstanceSnapshot?.name ?? 'Class';
  const instructorName = booking.classInstanceSnapshot?.instructor ?? 'Instructor';
  const venueName = booking.venueSnapshot?.name ?? booking.venueSnapshot?.name ?? 'Studio';

  const startTimeValue = booking.classInstanceSnapshot?.startTime;
  const startDate = startTimeValue ? new Date(startTimeValue) : null;

  const formattedDate = startDate
    ? format(startDate, 'MMM d', { in: tz(GREECE_TZ) })
    : 'TBD';
  const formattedTime = startDate
    ? format(startDate, 'HH:mm', { in: tz(GREECE_TZ) })
    : 'TBD';

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
      return 'STATUS';
    }

    if (booking.status === 'pending') {
      return 'CONFIRMED';
    }

    if (booking.status.includes('cancelled')) {
      return 'CANCELLED';
    }

    if (booking.status.includes('waitlist')) {
      return 'WAITLIST';
    }

    return booking.status.replace(/_/g, ' ').toUpperCase();
  }, [booking.status]);

  const isSwipeDisabled = booking.status ? booking.status !== 'pending' : false;

  return (
    <View style={[styles.screen, { paddingBottom: safeBottomPadding }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking Ticket</Text>
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
                    <Text style={styles.infoLabel}>Instructor</Text>
                    <Text style={styles.infoText}>{instructorName}</Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Date & Time</Text>
                    <Text style={styles.infoText}>{formattedDate} • {formattedTime}</Text>
                  </View>

                  <View style={styles.attendeeSection}>
                    <Text style={styles.attendeeLabel}>ATTENDEE</Text>
                    <Text style={styles.attendeeName}>
                      {booking.userSnapshot?.name ?? booking.userSnapshot?.name ?? 'Member'}
                    </Text>
                  </View>
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
                      {booking.userSnapshot?.name ?? booking.userSnapshot?.name ?? 'Member'}
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
          label="Swipe to confirm arrival"
          onConfirm={handleConfirm}
          disabled={isSwipeDisabled}
        />
        <Text style={styles.footerHelpText}>
          Drag the button to let the studio verify your check-in
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
    borderColor: theme.colors.zinc[400],
    borderStyle: 'dashed',
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
    borderStyle: 'dashed',
    borderTopWidth: 2,
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
});
