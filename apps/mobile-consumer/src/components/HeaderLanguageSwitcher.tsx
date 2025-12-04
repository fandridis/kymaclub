import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Modal,
    Pressable 
} from 'react-native';
import { GlobeIcon, CheckIcon } from 'lucide-react-native';
import { useTypedTranslation } from '../i18n/typed';
import { theme } from '../theme';

// Language codes with their English names (used as subtitle)
const LANGUAGES = [
    { code: 'en', englishName: 'English', flag: '🇺🇸' },
    { code: 'el', englishName: 'Greek', flag: '🇬🇷' }
] as const;

// Translated language names for each supported language
const LANGUAGE_NAMES: Record<string, Record<string, string>> = {
    en: {
        en: 'English',
        el: 'Greek',
    },
    el: {
        en: 'Αγγλικά',
        el: 'Ελληνικά',
    },
};

interface HeaderLanguageSwitcherProps {
    iconColor?: string;
    iconSize?: number;
}

/**
 * HeaderLanguageSwitcher - Globe icon button that opens a language selection modal
 * 
 * Designed for use in auth screens (landing, sign-in, register) where users
 * can select their preferred language before signing in/up.
 * 
 * The selected language is:
 * 1. Applied immediately to the UI (via i18n.changeLanguage)
 * 2. Stored locally (via i18n's cacheUserLanguage)
 * 3. Used for OTP email localization (via storePendingAuthLanguage mutation)
 */
export function HeaderLanguageSwitcher({ 
    iconColor = theme.colors.zinc[600],
    iconSize = 24 
}: HeaderLanguageSwitcherProps) {
    const { t, i18n } = useTypedTranslation();
    const [isModalVisible, setModalVisible] = useState(false);

    const handleLanguageSelect = async (languageCode: string) => {
        try {
            // Change language in i18n (also caches to local storage)
            await i18n.changeLanguage(languageCode);
            setModalVisible(false);
        } catch (error) {
            console.error('[HeaderLanguageSwitcher] Failed to change language:', error);
        }
    };

    // Get the current language code, defaulting to 'en' if not found
    const currentLangCode = LANGUAGE_NAMES[i18n.language] ? i18n.language : 'en';

    // Get translated name for a language in the current app language
    const getTranslatedName = (langCode: string): string => {
        return LANGUAGE_NAMES[currentLangCode]?.[langCode] || langCode;
    };

    // Modal title translations
    const modalTitle = currentLangCode === 'el' ? 'Επιλογή Γλώσσας' : 'Select Language';
    const cancelText = currentLangCode === 'el' ? 'Ακύρωση' : 'Cancel';

    return (
        <>
            <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setModalVisible(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <GlobeIcon size={iconSize} color={iconColor} />
            </TouchableOpacity>

            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable 
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        
                        {LANGUAGES.map((language) => {
                            const isSelected = i18n.language === language.code;
                            const translatedName = getTranslatedName(language.code);
                            
                            return (
                                <TouchableOpacity
                                    key={language.code}
                                    style={[
                                        styles.languageOption,
                                        isSelected && styles.selectedLanguageOption
                                    ]}
                                    onPress={() => handleLanguageSelect(language.code)}
                                >
                                    <Text style={styles.flagEmoji}>{language.flag}</Text>
                                    <View style={styles.languageTextContainer}>
                                        <Text style={[
                                            styles.languageName,
                                            isSelected && styles.selectedLanguageName
                                        ]}>
                                            {translatedName}
                                        </Text>
                                        <Text style={[
                                            styles.languageSubtitle,
                                            isSelected && styles.selectedLanguageSubtitle
                                        ]}>
                                            {language.englishName}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <CheckIcon 
                                            size={20} 
                                            color={theme.colors.emerald[600]} 
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>{cancelText}</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    iconButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '85%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
        textAlign: 'center',
        marginBottom: 16,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: theme.colors.zinc[50],
    },
    selectedLanguageOption: {
        backgroundColor: theme.colors.emerald[50],
        borderWidth: 1,
        borderColor: theme.colors.emerald[200],
    },
    flagEmoji: {
        fontSize: 28,
        marginRight: 14,
    },
    languageTextContainer: {
        flex: 1,
    },
    languageName: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
    },
    selectedLanguageName: {
        color: theme.colors.emerald[700],
    },
    languageSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[500],
        marginTop: 2,
    },
    selectedLanguageSubtitle: {
        color: theme.colors.emerald[600],
    },
    cancelButton: {
        marginTop: 8,
        padding: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: theme.fontSize.base,
        color: theme.colors.zinc[500],
        fontWeight: theme.fontWeight.medium,
    },
});

export default HeaderLanguageSwitcher;

