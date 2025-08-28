import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { useAuth } from '../../stores/auth-store';
import { SettingsGroup, SettingsHeader, SettingsRow } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';

export function SettingsProfileScreen() {
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

    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title="Profile" />
            <View style={styles.content}>
                <SettingsHeader title="Account Information" />

                <SettingsGroup>
                    <SettingsRow
                        title="Email"
                        subtitle={user.email || 'Not provided'}
                    />
                    <SettingsRow
                        title="Credits"
                        subtitle={`${user.credits ?? 0} credits`}
                    />
                </SettingsGroup>

                <SettingsHeader title="Actions" />
                <SettingsGroup>
                    <SettingsRow
                        title="Sign Out"
                        onPress={handleSignOut}
                        style={styles.signOutRow}
                    />
                </SettingsGroup>
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
    },
    signOutRow: {
        backgroundColor: '#fff',
    },
});