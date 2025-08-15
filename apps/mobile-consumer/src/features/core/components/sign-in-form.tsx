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

export function SignInForm() {
    const navigation = useNavigation();
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
    const [submitting, setSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    const handleSendCode = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setSubmitting(true);

        try {
            // Create FormData equivalent for React Native
            const formData = new FormData();
            formData.append('email', email);

            await signIn("resend-otp", formData);
            setStep({ email });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not send verification code. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code.trim()) {
            Alert.alert('Error', 'Please enter the verification code');
            return;
        }

        setSubmitting(true);

        try {
            // Create FormData with email and code
            const formData = new FormData();
            formData.append('email', step === 'signIn' ? email : step.email);
            formData.append('code', code);

            await signIn("resend-otp", formData);

            // Sign in successful!
            // The auth state will update automatically, which will trigger
            // the navigation structure to switch from auth stack to authenticated stack.
            // No manual navigation needed!

            // Close the modal (since SignInModal is presented as a modal)
            navigation.goBack();

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Invalid verification code. Please try again.');
            setSubmitting(false);
        }
    };

    const handleBackToSignIn = () => {
        setStep("signIn");
        setCode('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    {step === "signIn" ? (
                        <>
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>Welcome to KymaClub</Text>
                                <Text style={styles.subtitle}>Enter your email to sign in.</Text>
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
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, submitting && styles.buttonDisabled]}
                                onPress={handleSendCode}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Send Code</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>Check your email</Text>
                                <Text style={styles.subtitle}>
                                    We sent a verification code to {step.email}
                                </Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Verification Code</Text>
                                <TextInput
                                    style={styles.input}
                                    value={code}
                                    onChangeText={setCode}
                                    placeholder="Enter 8-digit code"
                                    keyboardType="number-pad"
                                    maxLength={8}
                                    editable={!submitting}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, submitting && styles.buttonDisabled]}
                                onPress={handleVerifyCode}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Sign In</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.outlineButton}
                                onPress={handleBackToSignIn}
                                disabled={submitting}
                            >
                                <Text style={styles.outlineButtonText}>Back to Sign In</Text>
                            </TouchableOpacity>
                        </>
                    )}
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