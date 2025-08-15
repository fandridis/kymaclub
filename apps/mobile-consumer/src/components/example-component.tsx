// ExampleComponent.tsx
import React from 'react';
import { View, Text, Switch, Button } from 'react-native';
import { appStorage, secureStorage } from '../utils/storage';

export const SettingsScreen = () => {
    // Using the type-safe hooks
    const [language, setLanguage] = appStorage.useLanguage();
    const [themeMode, setThemeMode] = appStorage.useThemeMode();
    const [notificationsEnabled, setNotificationsEnabled] = appStorage.useNotificationEnabled();
    const [userPreferences, setUserPreferences] = appStorage.useUserPreferences();
    const [userPin, setUserPin] = secureStorage.useUserPin()
    const [biometricEnabled, setBiometricEnabled] = secureStorage.useBiometricEnabled()

    // Components automatically re-render when these values change
    return (
        <View>
            <Text>Current Language: {language || 'Not set'}</Text>

            <Button
                title="Change to Greek"
                onPress={() => setLanguage('el')}
            />

            <Text>Theme: {themeMode || 'system'}</Text>

            <View>
                <Button
                    title="Light"
                    onPress={() => setThemeMode('light')}
                />
                <Button
                    title="Dark"
                    onPress={() => setThemeMode('dark')}
                />
            </View>

            <View>
                <Text>Notifications</Text>
                <Switch
                    value={notificationsEnabled || false}
                    onValueChange={setNotificationsEnabled}
                />
            </View>

            <Button
                title="Update Preferences"
                onPress={() => {
                    setUserPreferences({
                        fontSize: 16,
                        colorScheme: 'blue'
                    });
                }}
            />
        </View>
    );
};

// Example: Using in a custom hook
export const useUserSettings = () => {
    const [language] = appStorage.useLanguage();
    const [themeMode] = appStorage.useThemeMode();
    const [onboardingCompleted] = appStorage.useOnboardingCompleted();

    return {
        language: language || 'en',
        themeMode: themeMode || 'system',
        shouldShowOnboarding: !onboardingCompleted
    };
};