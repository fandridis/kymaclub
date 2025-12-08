import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Skeleton } from './Skeleton';
import { theme } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

// Match NewsScreen constants
const SECTION_PADDING = 12;
const CAROUSEL_ITEM_WIDTH = (screenWidth - (SECTION_PADDING * 2)) / 1.40;

interface NewsCardSkeletonProps {
  height?: number;
  width?: number;
}

export function NewsCardSkeleton({
  height = 260,
  width = CAROUSEL_ITEM_WIDTH
}: NewsCardSkeletonProps) {
  // Account for touchable padding (top 6 + bottom 8 = 14)
  const cardHeight = height - 14;
  // Bottom section is 60px (short version without footer)
  const bottomSectionHeight = 60;
  const imageSectionHeight = cardHeight - bottomSectionHeight;

  return (
    <View style={[styles.touchable, { width, height }]}>
      <View style={styles.shadowContainer}>
        <View style={styles.card}>
          {/* Image section skeleton */}
          <Skeleton
            width="100%"
            height={imageSectionHeight}
            borderRadius={0}
          />

          {/* Bottom section with text skeletons */}
          <View style={styles.bottomSection}>
            {/* Title skeleton */}
            <Skeleton
              width="80%"
              height={16}
              borderRadius={4}
            />
            {/* Subtitle skeleton */}
            <Skeleton
              width="60%"
              height={13}
              borderRadius={4}
              style={styles.subtitleSkeleton}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  touchable: {
    paddingTop: 6,
    paddingBottom: 8,
    paddingRight: 8,
  },
  shadowContainer: {
    flex: 1,
    width: '100%',
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
    backgroundColor: theme.colors.zinc[500],
  },
  bottomSection: {
    height: 60,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    gap: 8,
  },
  subtitleSkeleton: {
    marginTop: 4,
  },
});
