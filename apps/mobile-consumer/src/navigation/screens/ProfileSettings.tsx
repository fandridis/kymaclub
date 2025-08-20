import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { useAuth } from '../../stores/auth-store';
import { Settings as SettingsContainer, SettingsRow, SettingsSectionHeader } from '../../components/Settings';

export function ProfileSettings() {
    const { signOut } = useAuthActions();
    const { user, logout } = useAuth();

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            logout();
                            await signOut();
                        } catch (error) {
                            console.error('Sign out error:', error);
                            Alert.alert('Error', 'Failed to sign out. Please try again.');
                        }
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <SettingsSectionHeader title="Account Information" />
                {user && (
                    <SettingsContainer>
                        <SettingsRow
                            title="Email"
                            subtitle={user.email || 'Not provided'}
                        />
                        <SettingsRow
                            title="Credits"
                            subtitle={`${user.credits ?? 0} credits`}
                        />
                    </SettingsContainer>
                )}

                <SettingsSectionHeader title="Actions" />
                <SettingsContainer>
                    <SettingsRow
                        title="Sign Out"
                        onPress={handleSignOut}
                        style={styles.signOutRow}
                    />
                </SettingsContainer>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    signOutRow: {
        backgroundColor: '#fff',
    },
});