import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Skeleton } from './Skeleton';
import { theme } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

interface FeaturedCarouselSkeletonProps {
  height?: number;
}

export function FeaturedCarouselSkeleton({ height = 200 }: FeaturedCarouselSkeletonProps) {
  const cardWidth = screenWidth - 24;

  return (
    <View style={[styles.container, { height: height + 24 }]}>
      {/* Main card skeleton */}
      <View style={styles.cardContainer}>
        <Skeleton
          width={cardWidth}
          height={height}
          borderRadius={16}
        />
      </View>

      {/* Pagination dots skeleton */}
      <View style={styles.paginationContainer}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={[styles.dot, styles.inactiveDot]} />
        <View style={[styles.dot, styles.inactiveDot]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardContainer: {
    paddingHorizontal: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.zinc[200],
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 8,
  },
});
