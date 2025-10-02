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
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { secureStorage } from '../../../utils/storage';

interface SimpleRegisterFormProps {
    onSuccess: () => void;
    onBack: () => void;
}

export function RegisterForm({ onSuccess, onBack }: SimpleRegisterFormProps) {
    const navigation = useNavigation();
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"email" | { email: string }>("email");
    const [submitting, setSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [checkingUser, setCheckingUser] = useState(false);

    const checkUserExistsMutation = useMutation(api.mutations.core.checkUserExistsByEmail);

    const handleSendCode = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setCheckingUser(true);

        try {
            // First check if user already exists
            const userExists = await checkUserExistsMutation({ email: email.trim() });

            if (userExists) {
                Alert.alert(
                    'Account Already Exists',
                    'An account with this email already exists. Please sign in instead.',
                    [
                        {
                            text: 'Sign In',
                            onPress: () => {
                                // Navigate to sign-in screen
                                navigation.navigate('SignInModal' as never);
                            }
                        },
                        { text: 'OK' }
                    ]
                );
                return;
            }

            // User doesn't exist, proceed with OTP registration
            setSubmitting(true);

            // Create FormData equivalent for React Native
            const formData = new FormData();
            formData.append('email', email);

            await signIn("resend-otp", formData);
            setStep({ email });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not send verification code. Please try again.');
        } finally {
            setCheckingUser(false);
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
            formData.append('email', step === "email" ? email : step.email);
            formData.append('code', code);

            await signIn("resend-otp", formData);

            // Registration successful!
            // The auth state will update automatically, which will trigger
            // the navigation structure to switch from auth stack to authenticated stack.
            // No manual navigation needed!
            secureStorage.setIsAuthenticated(true);

            // Close the modal (since CreateAccountModal is presented as a modal)
            navigation.goBack();

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Invalid verification code. Please try again.');
            setSubmitting(false);
        }
    };

    const handleBackToEmail = () => {
        setStep("email");
        setCode('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.formContainer}>
                    {step === "email" ? (
                        <>
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>Create Account</Text>
                                <Text style={styles.subtitle}>Enter your email to get started</Text>
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
                                    editable={!submitting && !checkingUser}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, (submitting || checkingUser) && styles.buttonDisabled]}
                                onPress={handleSendCode}
                                disabled={submitting || checkingUser}
                            >
                                {(submitting || checkingUser) ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Create Account</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={onBack}
                                disabled={submitting || checkingUser}
                            >
                                <Text style={styles.backButtonText}>Back</Text>
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
                                    placeholder="Enter 6-digit code"
                                    keyboardType="number-pad"
                                    maxLength={6}
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
                                    <Text style={styles.buttonText}>Verify & Create Account</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBackToEmail}
                                disabled={submitting}
                            >
                                <Text style={styles.backButtonText}>Back to Email</Text>
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
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
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
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    button: {
        backgroundColor: '#000',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        backgroundColor: 'transparent',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
});
