import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StarIcon, MapPinIcon } from 'lucide-react-native';
import { useTypedTranslation } from '../i18n/typed';
import { Doc } from '@repo/api/convex/_generated/dataModel';
import { theme } from '../theme';


interface VenueCardProps {
  venue: Doc<'venues'>;
  storageIdToUrl: Map<string, string | null>;
  onPress?: (venue: Doc<'venues'>) => void;
}

export const VenueCard = ({ venue, storageIdToUrl, onPress }: VenueCardProps) => {
  const { t } = useTypedTranslation();

  const formatDistance = (distance: number) => {
    // Safety check for invalid distance values
    if (!isFinite(distance) || distance < 0) {
      return '0m';
    }

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <View style={styles.shadowContainer}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress?.(venue)}
        activeOpacity={0.8}
      >
        {/* Image */}
        <View style={styles.imageWrapper}>
          {venue.imageStorageIds?.[0] && storageIdToUrl.get(venue.imageStorageIds[0]) ? (
            <Image
              source={{ uri: storageIdToUrl.get(venue.imageStorageIds[0])! }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Images Available</Text>
            </View>
          )}

          {/* Top-left rating badge */}
          <View style={styles.ratingBadge}>
            <StarIcon size={12} color="#fff" fill="#ffd700" />
            <Text style={styles.ratingText}>{venue.rating?.toFixed(1)} ({venue.reviewCount || 0})</Text>
          </View>

          {/* Bottom gradient overlay */}
          <LinearGradient
            pointerEvents="none"
            colors={[
              'transparent',
              'rgba(0,0,0,0.25)',
              'rgba(0,0,0,0.65)',
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.bottomGradient}
          />

          {/* Bottom-left overlay text */}
          <View pointerEvents="none" style={styles.imageOverlayContainer}>
            <Text style={styles.imageOverlayTitle} numberOfLines={1}>
              {venue.name}
            </Text>
            <Text style={styles.imageOverlaySubtitle} numberOfLines={1}>
              {venue.primaryCategory}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: theme.colors.zinc[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.zinc[300],
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#f3f4f6',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    zIndex: 1,
  },
  imageOverlayContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 2,
    gap: 2,
  },
  imageOverlayTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  imageOverlaySubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
  },
  locationRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});