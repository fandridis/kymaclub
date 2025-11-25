import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { SettingsGroup, SettingsHeader, SettingsRow } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { useTypedTranslation } from '../../i18n/typed';
import { useLogout } from '../../hooks/useLogout';
import { DeleteAccountModal } from '../../components/DeleteAccountModal';
import { CommonActions, NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '..';

export function SettingsAccountScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { t } = useTypedTranslation();
    const deleteUser = useMutation(api.mutations.users.deleteUser);
    const logout = useLogout();
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

    const handleDeleteAccount = async () => {
        // 1. Soft delete the user (marks for permanent deletion in 7 days)
        await deleteUser();

        // 2. Logout and navigate to landing
        await logout(() => {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Landing" }],
                })
            );
        });
    };

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
                </SettingsGroup>

                <View style={{ height: 24 }} />

                <SettingsGroup>
                    <SettingsRow
                        title={t('settings.account.deleteAccount')}
                        subtitle={t('settings.account.deleteDescription')}
                        onPress={() => setIsDeleteModalVisible(true)}
                        variant="destructive"
                    />
                </SettingsGroup>

                <Text style={styles.comingSoon}>
                    {t('settings.account.comingSoon')}
                </Text>
            </View>

            <DeleteAccountModal
                isVisible={isDeleteModalVisible}
                onClose={() => setIsDeleteModalVisible(false)}
                onConfirm={handleDeleteAccount}
            />
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