import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../theme';

type RenderContent = () => React.ReactNode;

type TitleProps =
    | { title: string; renderTitle?: RenderContent }
    | { title?: string; renderTitle: RenderContent };

type SubtitleProps = {
    subtitle?: string;
    renderSubtitle?: RenderContent;
};

type SharedProps = {
    imageUrl?: string | null;
    renderTopLeft?: RenderContent;
    renderTopRight?: RenderContent;
    renderFooter?: RenderContent;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

export type NewsClassCardProps = TitleProps & SubtitleProps & SharedProps;

export function NewsClassCard({
    title,
    renderTitle,
    subtitle,
    renderSubtitle,
    imageUrl,
    renderTopLeft,
    renderTopRight,
    renderFooter,
    onPress,
    style,
    testID,
}: NewsClassCardProps) {
    const titleContent = renderTitle ? renderTitle() : title ? (
        <Text style={styles.title} numberOfLines={1}>
            {title}
        </Text>
    ) : null;

    const subtitleContent = renderSubtitle ? renderSubtitle() : subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
        </Text>
    ) : null;

    return (
        <TouchableOpacity
            activeOpacity={0.60}
            onPress={onPress}
            disabled={!onPress}
            style={[styles.touchable, style]}
            testID={testID}
        >
            <View style={styles.shadowContainer}>
                <View style={styles.card}>
                    <View style={styles.imageSection}>
                        {imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.image}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <View style={[styles.image, styles.imagePlaceholder]}>
                                <Text style={styles.imagePlaceholderText}>No image</Text>
                            </View>
                        )}

                        {renderTopLeft ? (
                            <View style={styles.topLeftOverlay}>{renderTopLeft()}</View>
                        ) : null}

                        {renderTopRight ? (
                            <View style={styles.topRightOverlay}>{renderTopRight()}</View>
                        ) : null}
                    </View>

                    <View style={[styles.bottomSection, !renderFooter && styles.bottomSectionShort]}>
                        <View style={styles.textSection}>
                            {titleContent}
                            {subtitleContent}
                        </View>

                        {renderFooter ? (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.footerSection}>{renderFooter()}</View>
                            </>
                        ) : null}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchable: {
        width: '100%',
        height: '100%',
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
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    card: {
        flex: 1,
        borderRadius: 18,
        paddingBottom: 4,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
    },
    imageSection: {
        flex: 1,
        position: 'relative',
        //    backgroundColor: theme.colors.zinc[100],
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePlaceholderText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.zinc[500],
    },
    topLeftOverlay: {
        position: 'absolute',
        top: 8,
        left: 8,
    },
    topRightOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        alignItems: 'flex-end',
        gap: 6,
    },
    bottomSection: {
        height: 92,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#ffffff',
        justifyContent: 'space-between',
    },
    bottomSectionShort: {
        height: 60,
        marginBottom: -4,
        justifyContent: 'center',
    },
    textSection: {
        justifyContent: 'center',
        gap: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.zinc[900],
    },
    subtitle: {
        fontSize: 13,
        color: theme.colors.zinc[500],
        lineHeight: 18,
    },
    divider: {
        height: 0.5,
        marginVertical: 10,
        backgroundColor: theme.colors.zinc[200],
    },
    footerSection: {
        flexShrink: 0,
        paddingTop: 0,
        gap: 10,
    },
});
