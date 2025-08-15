import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTypedTranslation } from '../i18n/typed';

const LanguageSwitcher = () => {
    const { i18n } = useTypedTranslation();

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'el', name: 'Ελληνικά' },
        { code: 'lt', name: 'Lietuvių' }
    ];

    const changeLanguage = async (languageCode: string) => {
        await i18n.changeLanguage(languageCode);
    };

    return (
        <View style={styles.container}>
            {languages.map((lang) => (
                <TouchableOpacity
                    key={lang.code}
                    style={[
                        styles.languageButton,
                        i18n.language === lang.code && styles.selectedLanguage
                    ]}
                    onPress={() => changeLanguage(lang.code)}
                >
                    <Text style={[
                        styles.languageText,
                        i18n.language === lang.code && styles.selectedText
                    ]}>
                        {lang.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 20
    },
    languageButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    selectedLanguage: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF'
    },
    languageText: {
        fontSize: 16,
        color: '#333'
    },
    selectedText: {
        color: 'white'
    }
});

export default LanguageSwitcher;