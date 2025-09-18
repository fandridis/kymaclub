import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';

import type { Doc } from '@repo/api/convex/_generated/dataModel';
import { theme } from '../theme';
import { MapPinIcon, TicketIcon } from 'lucide-react-native';

interface BookingCardProps {
  booking: Doc<'bookings'>;
  onViewClass?: (booking: Doc<'bookings'>) => void;
  onViewTicket?: (booking: Doc<'bookings'>) => void;
  showFooterIcons?: boolean;
}

const ATHENS_TZ = 'Europe/Athens';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Confirmed',
  attended: 'Attended',
  waitlist: 'Waitlisted',
  cancelled_by_consumer: 'Cancelled by you',
  cancelled_by_business: 'Cancelled by studio',
  cancelled_by_business_rebookable: 'Cancelled by studio',
};

const getStatusLabel = (status?: string): string | null => {
  if (!status) {
    return null;
  }

  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
};

const getStatusVariant = (status?: string): 'success' | 'warning' | 'danger' | 'info' => {
  switch (status) {
    case 'pending':
    case 'attended':
      return 'success';
    case 'waitlist':
      return 'warning';
    case 'cancelled_by_consumer':
    case 'cancelled_by_business':
    case 'cancelled_by_business_rebookable':
      return 'danger';
    default:
      return 'info';
  }
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onViewClass,
  onViewTicket,
  showFooterIcons = true,
}) => {
  const startTimeValue = booking.classInstanceSnapshot?.startTime;
  const startTime = startTimeValue ? new Date(startTimeValue) : null;

  const dateLabel = startTime ? format(startTime, 'MMM d', { in: tz(ATHENS_TZ) }) : '—';
  const timeLabel = startTime ? format(startTime, 'HH:mm', { in: tz(ATHENS_TZ) }) : '—';

  const className = booking.classInstanceSnapshot?.name ?? 'Class';
  const instructor = booking.classInstanceSnapshot?.instructor ?? '';
  const venueName = booking.venueSnapshot?.name ?? booking.venueSnapshot?.name ?? '';

  const metaLine = useMemo(() => {
    if (venueName && instructor) {
      return `${venueName} · ${instructor}`;
    }

    return venueName || instructor || '';
  }, [venueName, instructor]);

  const statusLabel = getStatusLabel(booking.status);
  const statusVariant = getStatusVariant(booking.status);
  const statusStyle = useMemo(() => {
    switch (statusVariant) {
      case 'success':
        return styles.status_success;
      case 'warning':
        return styles.status_warning;
      case 'danger':
        return styles.status_danger;
      default:
        return styles.status_info;
    }
  }, [statusVariant]);
  const isUpcoming = booking.status === 'pending';
  const shouldShowStatus = statusLabel && !isUpcoming;

  return (
    <View style={styles.shadowContainer}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => onViewClass?.(booking)} style={styles.card}>
        <View style={styles.dateColumn}>
          <Text style={styles.dateText}>{dateLabel}</Text>
          <Text style={styles.timeText}>{timeLabel}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.contentColumn}>
          <Text style={styles.className} numberOfLines={1}>
            {className}
          </Text>
          {!!metaLine && (
            <Text style={styles.metaText} numberOfLines={1}>
              {metaLine}
            </Text>
          )}

          {shouldShowStatus && (
            <View style={[styles.statusPill, statusStyle]}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          )}

          {showFooterIcons && isUpcoming && (
            <View style={styles.footerIcons}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={(event) => {
                  event.stopPropagation?.();
                  onViewClass?.(booking);
                }}
                style={styles.footerIconButton}
              >
                <MapPinIcon size={19} color={theme.colors.zinc[500]} strokeWidth={1.9} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={(event) => {
                  event.stopPropagation?.();
                  onViewTicket?.(booking);
                }}
                style={[styles.footerIconButton, !onViewTicket && styles.footerIconButtonDisabled]}
                disabled={!onViewTicket}
              >
                <TicketIcon size={19} color={theme.colors.zinc[500]} strokeWidth={1.9} />
              </TouchableOpacity>
            </View>
          )}
        </View>

      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: 22,
    shadowColor: theme.colors.zinc[500],
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    overflow: 'hidden',
  },
  dateColumn: {
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
    color: theme.colors.zinc[600],
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.zinc[200],
    opacity: 0.8,
  },
  contentColumn: {
    flex: 1,
    gap: 8,
  },
  className: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.zinc[500],
  },
  footerIcons: {
    marginTop: 13,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.zinc[100],
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  footerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.zinc[100],
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
  },
  footerIconButtonDisabled: {
    opacity: 0.5,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  status_success: {
    backgroundColor: theme.colors.emerald[500],
  },
  status_warning: {
    backgroundColor: theme.colors.amber[500],
  },
  status_danger: {
    backgroundColor: theme.colors.rose[500],
  },
  status_info: {
    backgroundColor: theme.colors.sky[500],
  },
});
