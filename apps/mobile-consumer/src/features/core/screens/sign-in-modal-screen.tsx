// sign-in-modal-screen.tsx
import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import { SignInForm } from '../components/sign-in-form';
import { HeaderLanguageSwitcher } from '../../../components/HeaderLanguageSwitcher';

/**
 * Sign In Modal Screen
 * 
 * No manual redirect logic needed - React Navigation 7's conditional screen groups
 * handle navigation automatically:
 * - When user authenticates, this screen disappears from the navigator
 * - User is automatically shown the appropriate screen (Onboarding or News)
 * - Any pending deep links are automatically retried via UNSTABLE_routeNamesChangeBehavior
 */
export function SignInModalScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <View style={styles.dragIndicator} />
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => navigation.goBack()}
                        >
                            <X size={24} color="#333" />
                        </TouchableOpacity>
                        <View style={styles.headerSpacer} />
                        <HeaderLanguageSwitcher />
                    </View>
                </View>

                <View style={styles.content}>
                    <SignInForm onBack={() => navigation.goBack()} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 8,
    },
    dragIndicator: {
        width: 36,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 8,
        paddingTop: 8,
    },
    headerSpacer: {
        flex: 1,
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
});
