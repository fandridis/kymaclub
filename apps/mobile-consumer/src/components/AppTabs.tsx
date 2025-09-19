import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextStyle,
    LayoutChangeEvent,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

export type AppTabKey = string;

export interface AppTabItem<T extends AppTabKey> {
    key: T;
    label: string;
    disabled?: boolean;
    labelStyle?: StyleProp<TextStyle>;
}

export interface AppTabsProps<T extends AppTabKey> {
    items: AppTabItem<T>[];
    activeKey: T;
    onChange: (key: T) => void;
    containerStyle?: StyleProp<ViewStyle>;
    tabsRowStyle?: StyleProp<ViewStyle>;
    tabButtonStyle?: StyleProp<ViewStyle>;
    tabButtonActiveStyle?: StyleProp<ViewStyle>;
    tabLabelStyle?: StyleProp<TextStyle>;
    tabLabelActiveStyle?: StyleProp<TextStyle>;
}

const UNDERLINE_TIMING = {
    duration: 220,
    easing: Easing.out(Easing.cubic),
};

const UNDERLINE_SPRING = {
    damping: 16,
    stiffness: 220,
    mass: 0.8,
    overshootClamping: false,
};

const MAX_OVERSHOOT_PX = 2;
const OVERSHOOT_FACTOR = 0.1;

export function AppTabs<T extends AppTabKey>({
    items,
    activeKey,
    onChange,
    containerStyle,
    tabsRowStyle,
    tabButtonStyle,
    tabButtonActiveStyle,
    tabLabelStyle,
    tabLabelActiveStyle,
}: AppTabsProps<T>) {
    const tabLayoutsRef = React.useRef<Record<AppTabKey, { x: number; width: number }>>({});
    const hasMeasuredActive = React.useRef(false);

    const underlineTranslateX = useSharedValue(0);
    const underlineWidth = useSharedValue(0);
    const underlineOpacity = useSharedValue(0);

    const underlineStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: underlineTranslateX.value }],
        width: underlineWidth.value,
        opacity: underlineOpacity.value,
    }));

    React.useEffect(() => {
        const allowedKeys = new Set<AppTabKey>(items.map((item) => item.key));
        Object.keys(tabLayoutsRef.current).forEach((key) => {
            const typedKey = key as AppTabKey;
            if (!allowedKeys.has(typedKey)) {
                delete tabLayoutsRef.current[typedKey];
            }
        });
    }, [items]);

    const animateToLayout = React.useCallback(
        (x: number, width: number) => {
            if (!hasMeasuredActive.current) {
                underlineTranslateX.value = x;
                underlineWidth.value = width;
                underlineOpacity.value = withTiming(1, UNDERLINE_TIMING);
                hasMeasuredActive.current = true;
                return;
            }

            underlineWidth.value = withTiming(width, UNDERLINE_TIMING);

            const currentX = underlineTranslateX.value;
            const distance = x - currentX;
            if (Math.abs(distance) < 0.5) {
                underlineTranslateX.value = withSpring(x, UNDERLINE_SPRING);
            } else {
                const overshoot = Math.max(
                    Math.min(distance * OVERSHOOT_FACTOR, MAX_OVERSHOOT_PX),
                    -MAX_OVERSHOOT_PX
                );

                underlineTranslateX.value = withSequence(
                    withTiming(x + overshoot, { duration: 140, easing: Easing.out(Easing.cubic) }),
                    withSpring(x, UNDERLINE_SPRING)
                );
            }

            underlineOpacity.value = withTiming(1, UNDERLINE_TIMING);
        },
        [underlineOpacity, underlineTranslateX, underlineWidth]
    );

    React.useEffect(() => {
        const layout = tabLayoutsRef.current[activeKey];

        if (!layout) {
            underlineOpacity.value = withTiming(0, UNDERLINE_TIMING);
            hasMeasuredActive.current = false;
            return;
        }

        animateToLayout(layout.x, layout.width);
    }, [activeKey, animateToLayout, items, underlineOpacity]);

    const handleTabLayout = React.useCallback(
        (key: AppTabKey) => (event: LayoutChangeEvent) => {
            const { x, width } = event.nativeEvent.layout;
            tabLayoutsRef.current[key] = { x, width };

            if (key !== activeKey) {
                return;
            }

            animateToLayout(x, width);
        },
        [activeKey, animateToLayout]
    );

    return (
        <View style={[styles.container, containerStyle]}>
            <View style={[styles.tabsRow, tabsRowStyle]}>
                {items.map((item) => {
                    const isActive = item.key === activeKey;

                    return (
                        <View
                            key={item.key}
                            style={styles.tabItem}
                            onLayout={handleTabLayout(item.key)}
                        >
                            <TouchableOpacity
                                activeOpacity={0.5}
                                style={[
                                    styles.tabButton,
                                    tabButtonStyle,
                                    isActive && styles.tabButtonActive,
                                    isActive && tabButtonActiveStyle,
                                    item.disabled && styles.tabButtonDisabled,
                                ]}
                                onPress={() => onChange(item.key)}
                                disabled={item.disabled}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: isActive, disabled: item.disabled }}
                            >
                                <Text
                                    style={[
                                        styles.tabLabel,
                                        tabLabelStyle,
                                        item.labelStyle,
                                        isActive && styles.tabLabelActive,
                                        isActive && tabLabelActiveStyle,
                                        item.disabled && styles.tabLabelDisabled,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}

                <Animated.View pointerEvents="none" style={[styles.underline, underlineStyle]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        paddingBottom: 4,
    },
    tabItem: {
        paddingHorizontal: 4,
    },
    tabButton: {
        paddingVertical: 4,
    },
    tabButtonActive: {},
    tabButtonDisabled: {
        opacity: 0.6,
    },
    tabLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.zinc[600],
    },
    tabLabelActive: {
        color: theme.colors.zinc[800],
        fontWeight: '600',
    },
    tabLabelDisabled: {
        color: theme.colors.zinc[400],
    },
    underline: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        height: 2,
        borderRadius: 999,
        backgroundColor: theme.colors.zinc[800],
    },
});
