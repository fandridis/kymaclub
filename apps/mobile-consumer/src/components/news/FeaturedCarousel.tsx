import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { theme } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

export type FeaturedItem = {
    id: string;
    title: string;
    subtitle?: string;
    backgroundColor: string;
    onPress?: () => void;
};

const MOCK_DATA: FeaturedItem[] = [
    {
        id: '1',
        title: 'New Studio Opening!',
        subtitle: 'Check out the new Yoga studio in downtown',
        backgroundColor: theme.colors.emerald[500],
    },
    {
        id: '2',
        title: 'Welcome Bonus',
        subtitle: 'Get 50 credits on your first top-up',
        backgroundColor: theme.colors.sky[500],
    },
    {
        id: '3',
        title: 'Black Friday Deals',
        subtitle: 'Limited time offers on all packages',
        backgroundColor: theme.colors.rose[500],
    },
    {
        id: '4',
        title: 'Refer a Friend',
        subtitle: 'Give $10, Get $10',
        backgroundColor: theme.colors.amber[500],
    },
    {
        id: '5',
        title: 'Summer Challenge',
        subtitle: 'Complete 10 classes in July',
        backgroundColor: theme.colors.zinc[800],
    },
];

interface FeaturedCarouselProps {
    data?: FeaturedItem[];
    width?: number;
    height?: number;
    autoPlay?: boolean;
    onItemPress?: (item: FeaturedItem) => void;
}

export function FeaturedCarousel({
    data = MOCK_DATA,
    width,
    height = 200,
    autoPlay = true,
    onItemPress,
}: FeaturedCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Desired visual width of the card
    const cardWidth = width || (screenWidth - 24);
    // Gap between slides
    const gap = 16;
    // Carousel stride width (card + gap)
    // This ensures the next slide is 'gap' pixels away from the current one
    const carouselWidth = cardWidth + gap;

    const handlePress = (item: FeaturedItem) => {
        if (item.onPress) {
            item.onPress();
        } else if (onItemPress) {
            onItemPress(item);
        }
    };

    const renderItem = ({ item }: { item: FeaturedItem }) => (
        <View style={[styles.itemContainer, { width: carouselWidth }]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handlePress(item)}
                style={[styles.card, { backgroundColor: item.backgroundColor, width: cardWidth, height }]}
            >
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
                </View>
            </TouchableOpacity>
        </View>
    );

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { height: height + 24 }]}>
            <Carousel
                width={carouselWidth}
                height={height}
                data={data}
                renderItem={renderItem}
                loop={data.length > 1}
                autoPlay={autoPlay}
                autoPlayInterval={7000}
                scrollAnimationDuration={1000}
                onSnapToItem={(index) => setCurrentIndex(index)}
                modeConfig={{
                    parallaxScrollingScale: 1,
                    parallaxScrollingOffset: 0,
                }}
                style={{ width: carouselWidth, height }}
            />

            {data.length > 1 && (
                <View style={styles.paginationContainer}>
                    {data.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex ? styles.activeDot : styles.inactiveDot,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    itemContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        borderRadius: 16,
        padding: 20,
        justifyContent: 'center',
        overflow: 'hidden',
        // Shadow
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
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
    },
    activeDot: {
        width: 24,
        backgroundColor: theme.colors.zinc[800],
    },
    inactiveDot: {
        width: 8,
        backgroundColor: theme.colors.zinc[300],
    },
});
