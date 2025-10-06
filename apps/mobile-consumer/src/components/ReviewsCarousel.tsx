import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
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
  const CAROUSEL_ITEM_WIDTH = screenWidth - (SECTION_PADDING * 2);

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Recent Reviews ({reviews.length})
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {reviews.map((review) => (
          <View
            key={review._id}
            style={[styles.carouselItem, { width: CAROUSEL_ITEM_WIDTH, marginRight: ITEM_GAP }]}
          >
            <ReviewCard review={review} />
          </View>
        ))}
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  carouselItem: {
    // Width and marginRight handled dynamically
  },
});