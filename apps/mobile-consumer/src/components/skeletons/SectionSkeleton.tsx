import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { NewsCardSkeleton } from './NewsCardSkeleton';
import { theme } from '../../theme';

const SECTION_PADDING = 12;

interface SectionSkeletonProps {
  title: string;
  cardHeight?: number;
  cardCount?: number;
  renderCard?: (index: number) => React.ReactNode;
}

export function SectionSkeleton({
  title,
  cardHeight = 260,
  cardCount = 2,
  renderCard,
}: SectionSkeletonProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.carouselScrollContent}
      >
        {Array.from({ length: cardCount }).map((_, index) => (
          renderCard ? (
            <React.Fragment key={index}>{renderCard(index)}</React.Fragment>
          ) : (
            <NewsCardSkeleton key={index} height={cardHeight} />
          )
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.zinc[900],
    marginBottom: 4,
    paddingHorizontal: SECTION_PADDING,
  },
  carouselScrollContent: {
    paddingHorizontal: SECTION_PADDING,
  },
});
