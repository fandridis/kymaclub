import { Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';
import LanguageSwitcher from '../../components/language-switcher';
import { useTypedTranslation } from '../../i18n/typed';

export function NewsScreen() {
    const { t } = useTypedTranslation();
    return (
        <View style={styles.container}>
            <Text>News Screen</Text>
            <Text>Latest news and updates will appear here</Text>
            <Text>{t('welcome.title')}</Text>
            <Text>{t('welcome.message', { name: 'John' })}</Text>

            <LanguageSwitcher />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
}); 