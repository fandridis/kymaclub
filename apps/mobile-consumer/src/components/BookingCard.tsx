import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClockIcon, XIcon } from 'lucide-react-native';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { useTypedTranslation } from '../i18n/typed';
import { getCancellationInfo, formatCancellationStatus } from '../utils/cancellationUtils';
import { Doc } from '@repo/api/convex/_generated/dataModel';

interface BookingCardProps {
  booking: Doc<"bookings">;
  onCancel?: (booking: Doc<"bookings">) => void;
  onViewClass?: (booking: Doc<"bookings">) => void;
  isCanceling?: boolean;
}

export const BookingCard = ({ booking, onCancel, onViewClass, isCanceling = false }: BookingCardProps) => {
  const { t } = useTypedTranslation();

  // Extract booking details
  const className = booking.classInstanceSnapshot?.name ?? 'Class';
  const instructor = booking.classInstanceSnapshot?.instructor ?? 'TBD';
  const venueName = booking.venueSnapshot?.name ?? 'Unknown Venue';

  // Time formatting in Europe/Athens timezone - use classInstanceSnapshot.startTime first
  const startTimeValue = booking.classInstanceSnapshot?.startTime;
  const endTimeValue = booking.classInstanceSnapshot?.endTime;
  const startTime = startTimeValue ? new Date(startTimeValue) : null;
  const endTime = endTimeValue ? new Date(endTimeValue) : null;

  // Check if booking is in the past
  const isPastBooking = startTime ? startTime.getTime() < Date.now() : false;

  // Check if booking is cancelled and determine cancellation source
  const isCancelled = booking.status === 'cancelled_by_business' || booking.status === 'cancelled_by_consumer' || booking.status === 'cancelled_by_business_rebookable';
  const cancelledByBusiness = booking.status === 'cancelled_by_business' || booking.status === 'cancelled_by_business_rebookable';
  const cancelledByConsumer = booking.status === 'cancelled_by_consumer';
  const isRebookable = booking.status === 'cancelled_by_business_rebookable' || booking.status === 'cancelled_by_consumer';

  const startTimeStr = startTime ? format(startTime, 'HH:mm', { in: tz('Europe/Athens') }) : '';
  const duration = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;

  // Calculate cancellation window information
  const cancellationInfo = useMemo(() => {
    console.log('booking.classInstanceSnapshot?.cancellationWindowHours', booking.classInstanceSnapshot?.cancellationWindowHours);
    if (!startTime || !booking.classInstanceSnapshot?.cancellationWindowHours) {
      return null;
    }

    return getCancellationInfo(
      startTime.getTime(),
      booking.classInstanceSnapshot?.cancellationWindowHours
    );
  }, [startTime, booking.classInstanceSnapshot?.cancellationWindowHours]);

  const cancellationStatusText = cancellationInfo ? formatCancellationStatus(cancellationInfo) : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onViewClass?.(booking)}
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
                {booking.status === 'cancelled_by_business_rebookable'
                  ? 'Cancelled by the studio'
                  : cancelledByBusiness
                    ? 'Cancelled by the studio'
                    : 'Cancelled by you'}
              </Text>
            </View>
            {/* Show cancel reason if it exists */}
            {booking.cancelReason && (
              <Text style={styles.cancelReasonText}>
                {booking.cancelReason}
              </Text>
            )}

            {/* Rebook button removed from list view - users can rebook from class details modal */}

            {/* Show "You cannot book this class again" only for non-rebookable cancellations */}
            {isCancelled && !isRebookable && (
              <Text style={styles.noRebookText}>
                You cannot book this class again
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
  noRebookText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#9ca3af', // Light gray
    marginTop: 6,
    textAlign: 'center',
  },
});