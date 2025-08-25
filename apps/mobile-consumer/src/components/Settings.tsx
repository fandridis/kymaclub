import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ViewStyle } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { theme } from '../theme';

// Settings Group - groups rows together with styling
interface SettingsGroupProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export function SettingsGroup({ children, style }: SettingsGroupProps) {
    return (
        <View style={[styles.settingsRowContainer, style]}>
            {children}
        </View>
    );
}

// Settings Header - simple header component
interface SettingsHeaderProps {
    title: string;
    subtitle?: string;
    renderSubtitle?: () => React.ReactNode;
    style?: ViewStyle;
}

export function SettingsHeader({ title, subtitle, renderSubtitle, style }: SettingsHeaderProps) {
    return (
        <View style={[styles.settingsHeaderContainer, style]}>
            <Text style={styles.settingsHeader}>
                {title}
            </Text>
            {renderSubtitle ? (
                renderSubtitle()
            ) : subtitle ? (
                <Text style={styles.settingsHeaderSubtitle}>
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
}

// Settings Row Component
interface SettingsRowProps {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
    // Function to completely override the right side rendering
    renderRightSide?: () => React.ReactNode;
    // Function to completely override the subtitle rendering
    renderSubtitle?: () => React.ReactNode;
    // Toggle functionality
    toggle?: {
        value: boolean;
        onToggle: (value: boolean) => void;
    };
    disabled?: boolean;
    style?: ViewStyle;
    titleStyle?: any;
    // Optional icon to display on the left side
    icon?: LucideIcon;
    iconColor?: string;
}

export function SettingsRow({
    title,
    subtitle,
    onPress,
    rightElement,
    showChevron = false,
    renderRightSide,
    renderSubtitle,
    toggle,
    disabled = false,
    style,
    titleStyle,
    icon: Icon,
    iconColor
}: SettingsRowProps) {
    // If renderRightSide is provided, use it to completely override the right side
    const rightSideContent = renderRightSide ? (
        renderRightSide()
    ) : (
        <>
            {toggle ? (
                <Switch
                    value={toggle.value}
                    onValueChange={toggle.onToggle}
                    disabled={disabled}
                    trackColor={{ false: '#767577', true: '#007AFF' }}
                    thumbColor={toggle.value ? '#fff' : '#f4f3f4'}
                />
            ) : rightElement}
            {!toggle && showChevron && (
                <ChevronRight
                    size={16}
                    color={disabled ? '#999' : '#666'}
                    style={styles.chevron}
                />
            )}
        </>
    );

    const finalOnPress = toggle ? undefined : onPress;
    const Component = finalOnPress ? TouchableOpacity : View;

    return (
        <Component
            style={[
                styles.settingsRow,
                disabled && styles.disabledRow,
                style
            ]}
            onPress={finalOnPress}
            disabled={disabled}
        >
            <View style={styles.settingsRowContent}>
                {Icon && (
                    <View style={styles.iconContainer}>
                        <Icon
                            size={20}
                            color={disabled ? theme.colors.zinc[400] : (iconColor || theme.colors.zinc[600])}
                        />
                    </View>
                )}
                <View style={[styles.settingsRowText, Icon && styles.settingsRowTextWithIcon]}>
                    <Text style={[
                        styles.settingsRowTitle,
                        disabled && styles.disabledText,
                        titleStyle
                    ]}>
                        {title}
                    </Text>
                    {renderSubtitle ? (
                        renderSubtitle()
                    ) : subtitle ? (
                        <Text style={[
                            styles.settingsRowSubtitle,
                            disabled && styles.disabledText
                        ]}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
                <View style={styles.settingsRowRight}>
                    {rightSideContent}
                </View>
            </View>
        </Component>
    );
}

// Settings Divider
interface SettingsDividerProps {
    style?: ViewStyle;
}

export function SettingsDivider({ style }: SettingsDividerProps) {
    return <View style={[styles.settingsDivider, style]} />;
}

// Section Footer (for explanatory text)
interface SettingsSectionFooterProps {
    text: string;
    style?: ViewStyle;
}

export function SettingsSectionFooter({ text, style }: SettingsSectionFooterProps) {
    return (
        <Text style={[styles.settingsSectionFooter, style]}>
            {text}
        </Text>
    );
}

const styles = StyleSheet.create({
    settingsRowContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.zinc[100],
        // marginBottom: 20,
        borderRadius: 0,
        overflow: 'hidden',
        width: '100%',
    },
    settingsHeaderContainer: {
        marginBottom: 12,
        marginTop: 20,
        marginHorizontal: 16,
    },
    settingsHeader: {
        fontSize: theme.fontSize.base,
        fontWeight: '600',
        color: theme.colors.zinc[500],
    },
    settingsHeaderSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.amber[600],
        marginTop: 4,
        fontWeight: theme.fontWeight.medium,
    },
    settingsRow: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        minHeight: 44,
    },
    disabledRow: {
        opacity: 0.6,
    },
    settingsRowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 44,
    },
    iconContainer: {
        marginRight: 12,
        width: 24,
        alignItems: 'center',
    },
    settingsRowText: {
        flex: 1,
        marginRight: 12,
    },
    settingsRowTextWithIcon: {
        marginRight: 12,
    },
    settingsRowTitle: {
        fontSize: 16,
        color: theme.colors.zinc[900],
        fontWeight: theme.fontWeight.medium,
    },
    settingsRowSubtitle: {
        fontSize: 14,
        color: theme.colors.zinc[500],
        marginTop: 2,
    },
    settingsRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chevron: {
        marginLeft: 8,
    },
    disabledText: {
        color: theme.colors.zinc[400],
    },
    settingsDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 16,
    },
    settingsSectionFooter: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        marginBottom: 20,
        marginHorizontal: 16,
        lineHeight: 20,
    },
});