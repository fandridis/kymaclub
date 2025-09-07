import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { ReviewCard } from './ReviewCard';
import type { Doc } from '@repo/api/convex/_generated/dataModel';
import { theme } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

interface ReviewsCarouselProps {
  reviews: Doc<"venueReviews">[];
  showTitle?: boolean;
}

export const ReviewsCarousel: React.FC<ReviewsCarouselProps> = ({
  reviews,
  showTitle = true
}) => {
  if (reviews.length === 0) {
    return null;
  }

  const ITEM_GAP = 12;
  const SECTION_PADDING = 20;
  const CAROUSEL_PADDING = SECTION_PADDING - (ITEM_GAP / 2);
  const CAROUSEL_ITEM_WIDTH = screenWidth - (SECTION_PADDING * 2) + ITEM_GAP;

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Recent Reviews ({reviews.length})
          </Text>
        </View>
      )}

      <View style={[styles.carouselContainer, { paddingHorizontal: CAROUSEL_PADDING }]}>
        <Carousel
          loop={false}
          width={CAROUSEL_ITEM_WIDTH}
          height={250}
          data={reviews}
          scrollAnimationDuration={500}
          snapEnabled
          renderItem={({ item: review }) => (
            <View style={[styles.carouselItem, { width: CAROUSEL_ITEM_WIDTH - ITEM_GAP }]}>
              <ReviewCard review={review} />
            </View>
          )}
          onConfigurePanGesture={(gestureChain) => {
            gestureChain
              .activeOffsetX([-10, 10])
              .failOffsetY([-15, 15]);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  carouselContainer: {
    // Padding handled by parent to align with other sections
  },
  carouselItem: {
    // Width handled dynamically
  },
});