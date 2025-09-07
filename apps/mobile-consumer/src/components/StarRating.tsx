import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { StarIcon } from 'lucide-react-native';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  interactive?: boolean;
  maxRating?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 24,
  interactive = false,
  maxRating = 5
}) => {
  const renderStar = (starIndex: number) => {
    const isFilled = starIndex < rating;
    const starColor = isFilled ? '#ffd700' : '#e5e7eb';
    const fillColor = isFilled ? '#ffd700' : 'transparent';

    if (interactive && onRatingChange) {
      return (
        <TouchableOpacity
          key={starIndex}
          style={styles.starTouchable}
          onPress={() => onRatingChange(starIndex + 1)}
          activeOpacity={0.7}
        >
          <StarIcon
            size={size}
            color={starColor}
            fill={fillColor}
          />
        </TouchableOpacity>
      );
    }

    return (
      <StarIcon
        key={starIndex}
        size={size}
        color={starColor}
        fill={fillColor}
      />
    );
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starTouchable: {
    padding: 4,
  },
});