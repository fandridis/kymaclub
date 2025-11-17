import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsGroup, SettingsHeader, SettingsRow } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { useTypedTranslation } from '../../i18n/typed';

export function SettingsAccountScreen() {
    const { t } = useTypedTranslation();

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title={t('settings.account.title')} />
            <View style={styles.content}>
                <SettingsHeader title={t('settings.account.accountSettings')} />
                <SettingsGroup>
                    <SettingsRow
                        title={t('settings.account.privacySettings')}
                        subtitle={t('settings.account.privacyDescription')}
                        onPress={() => {
                            // TODO: Navigate to privacy screen
                        }}
                    />
                    <SettingsRow
                        title={t('settings.account.dataStorage')}
                        subtitle={t('settings.account.dataDescription')}
                        onPress={() => {
                            // TODO: Navigate to data screen
                        }}
                    />
                    <SettingsRow
                        title={t('settings.account.deleteAccount')}
                        subtitle={t('settings.account.deleteDescription')}
                        onPress={() => {
                            // TODO: Navigate to delete account screen
                        }}
                    />
                </SettingsGroup>

                <Text style={styles.comingSoon}>
                    {t('settings.account.comingSoon')}
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
});