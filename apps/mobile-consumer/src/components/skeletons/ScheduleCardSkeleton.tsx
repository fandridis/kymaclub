import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Skeleton } from './Skeleton';
import { theme } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

// Match NewsScreen constants
const SECTION_PADDING = 12;
const CAROUSEL_ITEM_WIDTH = (screenWidth - (SECTION_PADDING * 2)) / 1.40;
const SCHEDULE_CAROUSEL_HEIGHT = 160;

interface ScheduleCardSkeletonProps {
  width?: number;
  height?: number;
}

export function ScheduleCardSkeleton({
  width = CAROUSEL_ITEM_WIDTH,
  height = SCHEDULE_CAROUSEL_HEIGHT,
}: ScheduleCardSkeletonProps) {
  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.shadowContainer}>
        <View style={styles.card}>
          {/* Top half - date and time */}
          <View style={styles.topHalf}>
            <Skeleton width="40%" height={14} borderRadius={4} />
            <Skeleton width="50%" height={20} borderRadius={4} style={styles.timeSkeleton} />
          </View>

          {/* Bottom half - title, instructor, location */}
          <View style={styles.bottomHalf}>
            <Skeleton width="70%" height={14} borderRadius={4} />
            <Skeleton width="50%" height={12} borderRadius={4} style={styles.instructorSkeleton} />
            <View style={styles.locationRow}>
              <Skeleton width={12} height={12} borderRadius={6} />
              <Skeleton width="60%" height={12} borderRadius={4} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 6,
    paddingBottom: 8,
    paddingRight: 8,
  },
  shadowContainer: {
    flex: 1,
    borderRadius: 18,
    shadowColor: theme.colors.zinc[500],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  topHalf: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 12,
  },
  timeSkeleton: {
    marginTop: 8,
  },
  bottomHalf: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 6,
  },
  instructorSkeleton: {
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
});
