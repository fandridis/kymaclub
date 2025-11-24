/**
 * NOT USED YET, MIGHT BE USEFUL LATER
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigation } from '@react-navigation/native';

export function SignInTesterForm() {
    const navigation = useNavigation();
    const { signIn } = useAuthActions();
    const [submitting, setSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const passwordInputRef = React.useRef<TextInput>(null);

    const handleSignIn = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!password.trim()) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setSubmitting(true);

        try {
            // Create FormData for email/password sign in
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);

            await signIn("password", formData);

            // Sign in successful!
            // The auth state will update automatically, which will trigger
            // the navigation structure to switch from auth stack to authenticated stack.
            // No manual navigation needed!

            // Close the modal (since SignInModal is presented as a modal)
            navigation.goBack();

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Invalid email or password. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formContainer}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Welcome to KymaClub</Text>
                        <Text style={styles.subtitle}>Sign in to your account</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            editable={!submitting}
                            returnKeyType="next"
                            onSubmitEditing={() => passwordInputRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            ref={passwordInputRef}
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="password"
                            editable={!submitting}
                            returnKeyType="go"
                            onSubmitEditing={handleSignIn}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, submitting && styles.buttonDisabled]}
                        onPress={handleSignIn}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        maxWidth: 350,
        alignSelf: 'center',
        width: '100%',
    },
    headerContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    button: {
        backgroundColor: '#000',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    outlineButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    outlineButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '500',
    },
});