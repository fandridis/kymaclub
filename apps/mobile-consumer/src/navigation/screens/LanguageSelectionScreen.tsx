import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CheckIcon } from 'lucide-react-native';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { SettingsGroup } from '../../components/Settings';
import { useTypedTranslation } from '../../i18n/typed';
import { theme } from '../../theme';

const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' }
];

export function LanguageSelectionScreen() {
    const navigation = useNavigation();
    const { i18n } = useTypedTranslation();

    const handleLanguageChange = async (languageCode: string) => {
        try {
            await i18n.changeLanguage(languageCode);
        } catch (error) {
            console.error('Error changing language:', error);
            Alert.alert('Error', 'Failed to change language. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title="App Language" />
            <View style={styles.content}>
                <View style={styles.headerSection}>
                    <Text style={styles.subtitle}>
                        Choose your preferred language for the app interface
                    </Text>
                </View>

                <SettingsGroup>
                    {LANGUAGES.map((language) => {
                        const isSelected = i18n.language === language.code;
                        return (
                            <TouchableOpacity
                                key={language.code}
                                style={[
                                    styles.languageOption,
                                    isSelected && styles.selectedLanguageOption
                                ]}
                                onPress={() => handleLanguageChange(language.code)}
                            >
                                <View style={styles.flagContainer}>
                                    <Text style={styles.flagEmoji}>{language.flag}</Text>
                                </View>
                                <View style={styles.languageInfo}>
                                    <Text style={[
                                        styles.languageName,
                                        isSelected && styles.selectedLanguageName
                                    ]}>
                                        {language.name}
                                    </Text>
                                    <Text style={[
                                        styles.nativeLanguageName,
                                        isSelected && styles.selectedNativeLanguageName
                                    ]}>
                                        {language.nativeName}
                                    </Text>
                                </View>
                                {isSelected && (
                                    <View style={styles.checkContainer}>
                                        <CheckIcon
                                            size={20}
                                            color={theme.colors.emerald[600]}
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </SettingsGroup>

                <View style={styles.infoSection}>
                    <Text style={styles.infoText}>
                        Language changes will take effect immediately
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },
    content: {
        flex: 1,
    },
    headerSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
    },
    subtitle: {
        fontSize: theme.fontSize.base,
        color: theme.colors.zinc[600],
        lineHeight: theme.fontSize.base * 1.4,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.zinc[100],
    },
    selectedLanguageOption: {
        backgroundColor: theme.colors.emerald[50],
    },
    flagContainer: {
        marginRight: theme.spacing.md,
        width: 32,
        alignItems: 'center',
    },
    flagEmoji: {
        fontSize: 24,
    },
    languageInfo: {
        flex: 1,
    },
    languageName: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
        marginBottom: 2,
    },
    selectedLanguageName: {
        color: theme.colors.emerald[700],
    },
    nativeLanguageName: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[600],
    },
    selectedNativeLanguageName: {
        color: theme.colors.emerald[600],
    },
    checkContainer: {
        marginLeft: theme.spacing.md,
    },
    infoSection: {
        marginTop: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    infoText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[500],
        textAlign: 'center',
        fontStyle: 'italic',
    },
});