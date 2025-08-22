import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClockIcon, XIcon } from 'lucide-react-native';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { useTypedTranslation } from '../i18n/typed';
import { getCancellationInfo, formatCancellationStatus } from '../utils/cancellationUtils';
// Using any type to avoid import issues with BookingWithDetails
interface BookingCardProps {
  booking: any;
  onCancel?: (booking: any) => void;
  onViewClass?: (booking: any) => void;
  isCanceling?: boolean;
}

export const BookingCard = ({ booking, onCancel, onViewClass, isCanceling = false }: BookingCardProps) => {
  const { t } = useTypedTranslation();

  // Extract booking details
  const className = booking.classInstance?.name ?? booking.classTemplate?.name ?? 'Class';
  const instructor = booking.classTemplate?.instructor ?? 'TBD';
  const venueName = booking.venue?.name ?? 'Unknown Venue';

  // Time formatting in Europe/Athens timezone - use classInstanceSnapshot.startTime first
  const startTimeValue = booking.classInstanceSnapshot?.startTime || booking.classInstance?.startTime;
  const endTimeValue = booking.classInstanceSnapshot?.endTime || booking.classInstance?.endTime;
  const startTime = startTimeValue ? new Date(startTimeValue) : null;
  const endTime = endTimeValue ? new Date(endTimeValue) : null;

  // Check if booking is in the past
  const isPastBooking = startTime ? startTime.getTime() < Date.now() : false;

  // Check if booking is cancelled and determine cancellation source
  const isCancelled = booking.status === 'cancelled_by_business' || booking.status === 'cancelled_by_consumer';
  const cancelledByBusiness = booking.status === 'cancelled_by_business';
  const cancelledByConsumer = booking.status === 'cancelled_by_consumer';

  const startTimeStr = startTime ? format(startTime, 'HH:mm', { in: tz('Europe/Athens') }) : '';
  const duration = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;

  // Calculate cancellation window information
  const cancellationInfo = useMemo(() => {
    if (!startTime || !booking.classTemplate?.cancellationWindowHours) {
      return null;
    }

    return getCancellationInfo(
      startTime.getTime(),
      booking.classTemplate.cancellationWindowHours
    );
  }, [startTime, booking.classTemplate?.cancellationWindowHours]);

  const cancellationStatusText = cancellationInfo ? formatCancellationStatus(cancellationInfo) : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onViewClass?.(booking.classInstance)}
      activeOpacity={0.7}
      disabled={isCanceling}
    >
      {/* Left side - Time and Duration */}
      <View style={styles.timeSection}>
        <Text style={styles.startTime}>
          {startTimeStr}
        </Text>
        <View style={styles.durationContainer}>
          <ClockIcon size={10} color="#666" />
          <Text style={styles.durationText}>
            {duration}min
          </Text>
        </View>
      </View>

      {/* Middle - Class details */}
      <View style={styles.detailsSection}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {className}
          </Text>
        </View>

        <View style={styles.businessRow}>
          <Text style={styles.businessName} numberOfLines={1}>
            {venueName}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.instructor} numberOfLines={1}>
            {instructor}
          </Text>
        </View>

        {/* Cancellation info - only show for future, non-cancelled bookings */}
        {!isPastBooking && !isCancelled && cancellationStatusText && (
          <View style={styles.cancellationRow}>
            <Text style={[
              styles.cancellationText,
              cancellationInfo?.isWithinWindow ? styles.freeCancelText : styles.partialRefundText
            ]}>
              {cancellationStatusText}
            </Text>
          </View>
        )}

        {/* Cancellation badge - moved to bottom */}
        {isCancelled && (
          <View style={styles.badgeContainer}>
            <View style={[
              styles.badge, 
              cancelledByBusiness ? styles.badgeBusiness : styles.badgeConsumer
            ]}>
              <Text style={styles.badgeText}>
                {cancelledByBusiness ? 'Cancelled by the studio' : 'Cancelled by you'}
              </Text>
            </View>
            {/* Show cancel reason if it exists */}
            {booking.cancelReason && (
              <Text style={styles.cancelReasonText}>
                {booking.cancelReason}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Right side - Action buttons */}
      <View style={styles.actionsSection}>
        {/* Only show cancel button for future, non-cancelled bookings */}
        {!isPastBooking && !isCancelled && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, isCanceling && styles.actionButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation();
              onCancel?.(booking);
            }}
            disabled={isCanceling}
          >
            <XIcon size={20} color={isCanceling ? "#9ca3af" : "#dc2626"} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 12,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeSection: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    paddingRight: 12,
  },
  startTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  detailsSection: {
    flex: 1,
    justifyContent: 'space-between',
    marginRight: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flex: 1,
  },
  businessName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    flexShrink: 1,
  },
  separator: {
    fontSize: 12,
    color: '#ccc',
    marginHorizontal: 6,
  },
  instructor: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
  },
  cancellationRow: {
    marginTop: 4,
  },
  cancellationText: {
    fontSize: 10,
    fontWeight: '500',
  },
  freeCancelText: {
    color: '#16a34a', // Green for free cancellation
  },
  partialRefundText: {
    color: '#d97706', // Orange for partial refund
  },
  actionsSection: {
    width: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#dc2626',
  },
  actionButtonDisabled: {
    opacity: 0.5,
    borderColor: '#9ca3af',
  },
  badgeContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    maxWidth: '100%',
  },
  badgeBusiness: {
    backgroundColor: '#fef3c7', // Light amber background
    borderWidth: 1,
    borderColor: '#f59e0b', // Amber border
  },
  badgeConsumer: {
    backgroundColor: '#e5e7eb', // Light gray background  
    borderWidth: 1,
    borderColor: '#9ca3af', // Gray border
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151', // Dark gray text
  },
  cancelReasonText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#6b7280', // Lighter gray for reason text
    marginTop: 4,
    lineHeight: 14,
  },
});