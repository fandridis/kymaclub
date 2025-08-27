import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClockIcon, DiamondIcon, UserIcon } from 'lucide-react-native';
import { useTypedTranslation } from '../i18n/typed';
import type { ClassInstance } from '../hooks/use-class-instances';
import { centsToCredits } from '@repo/utils/credits';

interface ClassCardProps {
  classInstance: ClassInstance;
  onPress?: (classInstance: ClassInstance) => void;
}

export const ClassCard = memo<ClassCardProps>(({ classInstance, onPress }) => {
  const { t } = useTypedTranslation();

  const businessName = classInstance.venueSnapshot?.name ?? 'Unknown Venue';
  const startTime = new Date(classInstance.startTime);
  const startTimeStr = startTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const duration = Math.round((classInstance.endTime - classInstance.startTime) / (1000 * 60));
  const price = classInstance.price;
  const spotsLeft = Math.max(0, (classInstance.capacity ?? 0) - (classInstance.bookedCount ?? 0));
  const isSoldOut = spotsLeft === 0;

  return (
    <TouchableOpacity
      style={[styles.container, isSoldOut && styles.soldOutContainer]}
      onPress={() => onPress?.(classInstance)}
      activeOpacity={0.7}
      disabled={isSoldOut}
    >
      {/* Left side - Time and Duration */}
      <View style={styles.timeSection}>
        <Text style={[styles.startTime, isSoldOut && styles.soldOutText]}>
          {startTimeStr}
        </Text>
        <View style={styles.durationContainer}>
          <ClockIcon size={10} color="#666" />
          <Text style={styles.durationText}>
            {duration}min
          </Text>
        </View>
      </View>

      {/* Right side - Class details */}
      <View style={styles.detailsSection}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isSoldOut && styles.soldOutText]} numberOfLines={1}>
            {classInstance.name}
          </Text>
          <View style={styles.priceContainer}>
            <DiamondIcon size={16} color="#222" />
            <Text style={styles.priceText}>{centsToCredits(price ?? 0)}</Text>
          </View>
        </View>

        <View style={styles.businessRow}>
          <Text style={styles.businessName} numberOfLines={1}>
            {businessName}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.instructor} numberOfLines={1}>
            {classInstance.instructor}
          </Text>
        </View>

        <View style={styles.spotsRow}>
          <UserIcon size={12} color={isSoldOut ? '#ef4444' : '#16a34a'} />
          <Text style={[styles.spotsText, isSoldOut && styles.soldOutText]}>
            {isSoldOut
              ? t('explore.soldOut')
              : t('explore.spotsLeft', { count: spotsLeft })
            }
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

ClassCard.displayName = 'ClassCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 12,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  soldOutContainer: {
    opacity: 0.6,
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
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
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
  spotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spotsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  soldOutText: {
    color: '#ef4444',
  },
});