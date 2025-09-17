import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { SettingsGroup, SettingsHeader, SettingsRow } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { useTypedTranslation } from '../../i18n/typed';
import { theme } from '../../theme';

export function SettingsAccountScreen() {
    const navigation = useNavigation();
    const { i18n } = useTypedTranslation();

    const getLanguageDisplay = (languageCode: string) => {
        const languages = {
            'en': { name: 'English', flag: '🇺🇸' },
            'el': { name: 'Ελληνικά', flag: '🇬🇷' },
            'lt': { name: 'Lietuvių', flag: '🇱🇹' }
        };
        const lang = languages[languageCode as keyof typeof languages] || languages['en'];
        return `${lang.flag} ${lang.name}`;
    };

    const handleLanguagePress = () => {
        navigation.navigate('LanguageSelection' as never);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title="Account" />
            <View style={styles.content}>
                <SettingsHeader title="App Settings" />
                <SettingsGroup>
                    <SettingsRow
                        title="App Language"
                        subtitle={getLanguageDisplay(i18n.language)}
                        renderRightSide={() => (
                            <TouchableOpacity
                                style={styles.changeButton}
                                onPress={handleLanguagePress}
                            >
                                <Text style={styles.changeButtonText}>Change</Text>
                            </TouchableOpacity>
                        )}
                    />
                </SettingsGroup>

                <SettingsHeader title="Account Settings" />
                <SettingsGroup>
                    <SettingsRow
                        title="Privacy Settings"
                        subtitle="Manage your privacy preferences"
                        onPress={() => {
                            // TODO: Navigate to privacy screen
                        }}
                    />
                    <SettingsRow
                        title="Data & Storage"
                        subtitle="Manage your data and storage"
                        onPress={() => {
                            // TODO: Navigate to data screen
                        }}
                    />
                    <SettingsRow
                        title="Delete Account"
                        subtitle="Permanently delete your account"
                        onPress={() => {
                            // TODO: Navigate to delete account screen
                        }}
                    />
                </SettingsGroup>

                <Text style={styles.comingSoon}>
                    Account management coming soon
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        flex: 1,
    },
    comingSoon: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 40,
    },
    changeButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: theme.colors.zinc[50],
        borderRadius: 6,
    },
    changeButtonText: {
        color: theme.colors.zinc[950],
        fontSize: 14,
        fontWeight: '600',
    },
});