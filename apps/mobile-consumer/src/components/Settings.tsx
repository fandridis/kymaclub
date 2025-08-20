import React, { Children, cloneElement, isValidElement } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

// Main Settings Container that auto-handles first/last positioning
interface SettingsProps {
    children: React.ReactNode;
    style?: any;
}

export function Settings({ children, style }: SettingsProps) {
    const validChildren = Children.toArray(children).filter(
        child => isValidElement(child) && 
        (child.type === SettingsRow || child.type === SettingsDivider || child.type === SettingsSwitchRow)
    );

    return (
        <View style={[styles.settingsGroup, style]}>
            {validChildren.map((child, index) => {
                if (isValidElement(child) && (child.type === SettingsRow || child.type === SettingsSwitchRow)) {
                    return cloneElement(child as any, {
                        key: index,
                        isFirst: index === 0,
                        isLast: index === validChildren.length - 1,
                        ...child.props
                    });
                }
                return child;
            })}
        </View>
    );
}

// Legacy SettingsGroup for backward compatibility
interface SettingsGroupProps {
    children: React.ReactNode;
    style?: any;
}

export function SettingsGroup({ children, style }: SettingsGroupProps) {
    return <Settings style={style}>{children}</Settings>;
}

// Settings Row Component
interface SettingsRowProps {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
    // Toggle functionality
    toggle?: {
        value: boolean;
        onToggle: (value: boolean) => void;
    };
    disabled?: boolean;
    style?: any;
    isFirst?: boolean; // Auto-managed by Settings container
    isLast?: boolean;  // Auto-managed by Settings container
}

export function SettingsRow({
    title,
    subtitle,
    onPress,
    rightElement,
    showChevron = false,
    toggle,
    disabled = false,
    style,
    isFirst = false,
    isLast = false
}: SettingsRowProps) {
    // If toggle is provided, use it as rightElement and handle onPress
    const finalRightElement = toggle ? (
        <Switch
            value={toggle.value}
            onValueChange={toggle.onToggle}
            disabled={disabled}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={toggle.value ? '#fff' : '#f4f3f4'}
        />
    ) : rightElement;

    const finalOnPress = toggle ? undefined : onPress;
    const finalShowChevron = toggle ? false : showChevron;
    
    const Component = finalOnPress ? TouchableOpacity : View;

    return (
        <Component
            style={[
                styles.settingsRow,
                isFirst && styles.firstRow,
                isLast && styles.lastRow,
                disabled && styles.disabledRow,
                style
            ]}
            onPress={finalOnPress}
            disabled={disabled}
        >
            <View style={styles.settingsRowContent}>
                <View style={styles.settingsRowText}>
                    <Text style={[
                        styles.settingsRowTitle,
                        disabled && styles.disabledText
                    ]}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={[
                            styles.settingsRowSubtitle,
                            disabled && styles.disabledText
                        ]}>
                            {subtitle}
                        </Text>
                    )}
                </View>
                <View style={styles.settingsRowRight}>
                    {finalRightElement}
                    {finalShowChevron && (
                        <ChevronRight
                            size={16}
                            color={disabled ? '#999' : '#666'}
                            style={styles.chevron}
                        />
                    )}
                </View>
            </View>
        </Component>
    );
}

// Settings Divider
interface SettingsDividerProps {
    style?: any;
}

export function SettingsDivider({ style }: SettingsDividerProps) {
    return <View style={[styles.settingsDivider, style]} />;
}

// Convenience component for switch rows (legacy, use toggle prop instead)
interface SettingsSwitchRowProps {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    style?: any;
    isFirst?: boolean; // Auto-managed by Settings container
    isLast?: boolean;  // Auto-managed by Settings container
}

export function SettingsSwitchRow({
    title,
    subtitle,
    value,
    onValueChange,
    disabled = false,
    style,
    isFirst = false,
    isLast = false
}: SettingsSwitchRowProps) {
    return (
        <SettingsRow
            title={title}
            subtitle={subtitle}
            disabled={disabled}
            style={style}
            isFirst={isFirst}
            isLast={isLast}
            toggle={{
                value,
                onToggle: onValueChange
            }}
        />
    );
}

// Section Header
interface SettingsSectionHeaderProps {
    title: string;
    style?: any;
}

export function SettingsSectionHeader({ title, style }: SettingsSectionHeaderProps) {
    return (
        <Text style={[styles.sectionHeader, style]}>
            {title}
        </Text>
    );
}

// Section Footer (for explanatory text)
interface SettingsSectionFooterProps {
    text: string;
    style?: any;
}

export function SettingsSectionFooter({ text, style }: SettingsSectionFooterProps) {
    return (
        <Text style={[styles.sectionFooter, style]}>
            {text}
        </Text>
    );
}

const styles = StyleSheet.create({
    settingsGroup: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f0f0f0', // make it a bit
        marginBottom: 20,
        borderRadius: 8,
        overflow: 'hidden',
    },
    settingsRow: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        minHeight: 44,
    },
    firstRow: {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    lastRow: {
        borderBottomWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
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
    settingsRowText: {
        flex: 1,
        marginRight: 12,
    },
    settingsRowTitle: {
        fontSize: 16,
        color: '#333',
        fontWeight: '400',
    },
    settingsRowSubtitle: {
        fontSize: 14,
        color: '#666',
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
        color: '#999',
    },
    settingsDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 16,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 20,
        marginHorizontal: 16,
    },
    sectionFooter: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        marginBottom: 20,
        marginHorizontal: 16,
        lineHeight: 20,
    },
});