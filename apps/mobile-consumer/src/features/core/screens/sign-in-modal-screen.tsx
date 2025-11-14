// components/sign-in-modal.tsx
import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommonActions, useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import { SignInForm } from '../components/sign-in-form';
import { api } from '@repo/api/convex/_generated/api';
import { useConvexAuth, useQuery } from 'convex/react';

export function SignInModalScreen() {
    const navigation = useNavigation();
    const { isAuthenticated } = useConvexAuth();
    const data = useQuery(api.queries.core.getCurrentUserQuery, isAuthenticated ? {} : 'skip');
    const user = data?.user;


    useEffect(() => {
        if (user) {
            const redirectTo = user.hasConsumerOnboarded ? 'News' : 'Onboarding';
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: redirectTo }],
                })
            );
        }
    }, [user, navigation])

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <View style={styles.dragIndicator} />
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <X size={24} color="#333" />
                    </TouchableOpacity>
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
        paddingBottom: 16,
    },
    dragIndicator: {
        width: 36,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
});