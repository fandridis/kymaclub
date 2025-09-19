import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';
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
    return (
        <View style={[styles.container, containerStyle]}>
            <View style={[styles.tabsRow, tabsRowStyle]}>
                {items.map((item) => {
                    const isActive = item.key === activeKey;

                    return (
                        <TouchableOpacity
                            activeOpacity={0.50}
                            key={item.key}
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
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabButton: {
        paddingVertical: 4,
        borderBottomWidth: 1.5,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: theme.colors.zinc[800],
    },
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
});
