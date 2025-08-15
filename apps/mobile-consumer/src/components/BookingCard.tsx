import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClockIcon, XIcon, EyeIcon } from 'lucide-react-native';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { useTypedTranslation } from '../i18n/typed';
// Using any type to avoid import issues with BookingWithDetails
interface BookingCardProps {
  booking: any;
  onCancel?: (booking: any) => void;
  onViewClass?: (booking: any) => void;
  isCanceling?: boolean;
}

export const BookingCard = memo<BookingCardProps>(({ booking, onCancel, onViewClass, isCanceling = false }) => {
  const { t } = useTypedTranslation();

  // Extract booking details
  const className = booking.classInstance?.name ?? booking.classTemplate?.name ?? 'Class';
  const instructor = booking.classTemplate?.instructor ?? 'TBD';
  const venueName = booking.venue?.name ?? 'Unknown Venue';

  // Time formatting in Europe/Athens timezone
  const startTime = booking.classInstance ? new Date(booking.classInstance.startTime) : null;
  const endTime = booking.classInstance ? new Date(booking.classInstance.endTime) : null;

  const startTimeStr = startTime ? format(startTime, 'HH:mm', { in: tz('Europe/Athens') }) : '';
  const duration = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;

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

        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {booking.status === 'pending' ? 'Confirmed' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Right side - Action buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={(e) => {
            e.stopPropagation();
            onViewClass?.(booking);
          }}
          disabled={isCanceling}
        >
          <EyeIcon size={20} color="#0000ff" />
        </TouchableOpacity>

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
      </View>
    </TouchableOpacity>
  );
});

BookingCard.displayName = 'BookingCard';

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
  actionsSection: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 3,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  viewButton: {
    backgroundColor: '#fff',
    borderColor: '#0000ff',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#dc2626',
  },
  actionButtonDisabled: {
    opacity: 0.5,
    borderColor: '#9ca3af',
  },
});