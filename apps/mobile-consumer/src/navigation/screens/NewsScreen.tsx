import React from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, SafeAreaView } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useTypedTranslation } from '../../i18n/typed';
import { theme } from '../../theme';
import { TabScreenHeader } from '../../components/TabScreenHeader';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = screenWidth * 0.6; // 60% of screen width to show 2.5 cards
const ITEM_SPACING = 16; // Spacing between cards

// Mock data for carousels
const mockUpcomingClasses = [
    { id: 1, title: 'Yoga Flow', time: '10:00 AM', instructor: 'Sarah Johnson', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 2, title: 'Pilates Core', time: '2:00 PM', instructor: 'Mike Chen', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
    { id: 3, title: 'HIIT Training', time: '6:00 PM', instructor: 'Emma Davis', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
    { id: 4, title: 'Zumba Dance', time: '7:30 PM', instructor: 'Carlos Rodriguez', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
];

const mockLastMinuteOffers = [
    { id: 1, title: '50% Off Yoga', originalPrice: '$30', discountedPrice: '$15', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 2, title: 'Flash Sale Pilates', originalPrice: '$25', discountedPrice: '$12', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
    { id: 3, title: 'HIIT Bundle Deal', originalPrice: '$40', discountedPrice: '$20', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
];

const mockNewClasses = [
    { id: 1, title: 'Aerial Yoga', level: 'Intermediate', instructor: 'Lisa Park', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 2, title: 'Boxing Basics', level: 'Beginner', instructor: 'Tom Wilson', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
    { id: 3, title: 'Meditation & Mindfulness', level: 'All Levels', instructor: 'Dr. Zen', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 4, title: 'Functional Training', level: 'Advanced', instructor: 'Alex Thompson', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
];

const mockCategories = [
    { id: 1, name: 'Yoga', count: '24 classes', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 2, name: 'Strength', count: '18 classes', image: 'https://images.unsplash.com/photo-1571019613454-1fcb009e0b?w=400&h=300&fit=crop' },
    { id: 3, name: 'Cardio', count: '15 classes', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 4, name: 'Mind & Body', count: '12 classes', image: 'https://images.unsplash.com/photo-1571019613454-1fcb009e0b?w=400&h=300&fit=crop' },
];

const WhatsNewBanner = () => (
    <View style={styles.whatsNewBanner}>
        <View style={styles.bannerIcon}>
            <Text style={styles.bannerIconText}>🎉</Text>
        </View>
        <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>What's New!</Text>
            <Text style={styles.bannerSubtitle}>New yoga studio opening next week</Text>
        </View>
        <View style={styles.bannerAction}>
            <Text style={styles.bannerActionText}>Learn More</Text>
        </View>
    </View>
);

const CarouselItem = ({ item, type }: { item: any; type: string }) => {
    const renderContent = () => {
        switch (type) {
            case 'upcoming':
                return (
                    <View style={styles.upcomingItem}>
                        <View style={styles.upcomingImageContainer}>
                            <View style={styles.upcomingImage} />
                        </View>
                        <View style={styles.upcomingContent}>
                            <Text style={styles.upcomingTitle}>{item.title}</Text>
                            <Text style={styles.upcomingTime}>{item.time}</Text>
                            <Text style={styles.upcomingInstructor}>{item.instructor}</Text>
                        </View>
                    </View>
                );
            case 'offers':
                return (
                    <View style={styles.offerItem}>
                        <View style={styles.offerImageContainer}>
                            <View style={styles.offerImage} />
                        </View>
                        <View style={styles.offerContent}>
                            <Text style={styles.offerTitle}>{item.title}</Text>
                            <View style={styles.priceContainer}>
                                <Text style={styles.originalPrice}>{item.originalPrice}</Text>
                                <Text style={styles.discountedPrice}>{item.discountedPrice}</Text>
                            </View>
                        </View>
                    </View>
                );
            case 'new':
                return (
                    <View style={styles.newClassItem}>
                        <View style={styles.newClassImageContainer}>
                            <View style={styles.newClassImage} />
                        </View>
                        <View style={styles.newClassContent}>
                            <Text style={styles.newClassTitle}>{item.title}</Text>
                            <Text style={styles.newClassLevel}>{item.level}</Text>
                            <Text style={styles.newClassInstructor}>{item.instructor}</Text>
                        </View>
                    </View>
                );
            case 'categories':
                return (
                    <View style={styles.categoryItem}>
                        <View style={styles.categoryImageContainer}>
                            <View style={styles.categoryImage} />
                        </View>
                        <View style={styles.categoryContent}>
                            <Text style={styles.categoryName}>{item.name}</Text>
                            <Text style={styles.categoryCount}>{item.count}</Text>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.carouselItem}>
            {renderContent()}
        </View>
    );
};

const CarouselSection = ({ title, data, type }: { title: string; data: any[]; type: string }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.carouselContainer}>
            <Carousel
                loop
                width={ITEM_WIDTH}
                height={200}
                data={data}
                scrollAnimationDuration={1000}
                renderItem={({ item }) => <CarouselItem item={item} type={type} />}
                style={styles.carousel}
            />
        </View>
    </View>
);

export function NewsScreen() {
    const { t } = useTypedTranslation();

    return (
        <SafeAreaView style={styles.container}>
            <TabScreenHeader title={t('welcome.title')} />
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.subtitleContainer}>
                    <Text style={styles.subtitleText}>Discover amazing fitness classes</Text>
                </View>

                <WhatsNewBanner />

                <CarouselSection
                    title="Your upcoming classes"
                    data={mockUpcomingClasses}
                    type="upcoming"
                />

                <CarouselSection
                    title="Last minute offers"
                    data={mockLastMinuteOffers}
                    type="offers"
                />

                <CarouselSection
                    title="New classes"
                    data={mockNewClasses}
                    type="new"
                />

                <CarouselSection
                    title="Categories"
                    data={mockCategories}
                    type="categories"
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },
    scrollContent: {
        paddingBottom: 80,
    },
    subtitleContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: theme.colors.zinc[50],
    },
    subtitleText: {
        fontSize: 16,
        color: '#6c757d',
    },
    section: {
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    carouselContainer: {
        paddingHorizontal: 20,
    },
    carousel: {
        width: screenWidth,
    },
    carouselItem: {
        width: ITEM_WIDTH,
        paddingHorizontal: ITEM_SPACING / 2,
    },
    // Upcoming classes styles
    upcomingItem: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    upcomingImageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    upcomingImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e9ecef',
        borderRadius: 12,
    },
    upcomingContent: {
        flex: 1,
    },
    upcomingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    upcomingTime: {
        fontSize: 14,
        color: '#007bff',
        fontWeight: '500',
        marginBottom: 2,
    },
    upcomingInstructor: {
        fontSize: 12,
        color: '#6c757d',
    },
    // Offers styles
    offerItem: {
        backgroundColor: '#fff3cd',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#ffc107',
    },
    offerImageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    offerImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#ffeaa7',
        borderRadius: 12,
    },
    offerContent: {
        flex: 1,
    },
    offerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    originalPrice: {
        fontSize: 14,
        color: '#6c757d',
        textDecorationLine: 'line-through',
    },
    discountedPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#dc3545',
    },
    // New classes styles
    newClassItem: {
        backgroundColor: '#d1ecf1',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#17a2b8',
    },
    newClassImageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    newClassImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#bee5eb',
        borderRadius: 12,
    },
    newClassContent: {
        flex: 1,
    },
    newClassTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0c5460',
        marginBottom: 4,
    },
    newClassLevel: {
        fontSize: 12,
        color: '#17a2b8',
        fontWeight: '500',
        marginBottom: 2,
    },
    newClassInstructor: {
        fontSize: 12,
        color: '#6c757d',
    },
    // Categories styles
    categoryItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    categoryImageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e9ecef',
        borderRadius: 12,
    },
    categoryContent: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    categoryCount: {
        fontSize: 12,
        color: '#6c757d',
    },
    // Whats New Banner styles
    whatsNewBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 16,
        marginHorizontal: 20,
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#64b5f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bannerIconText: {
        fontSize: 24,
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 12,
        color: '#6c757d',
    },
    bannerAction: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#42a5f5',
        borderRadius: 8,
    },
    bannerActionText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '500',
    },
});
