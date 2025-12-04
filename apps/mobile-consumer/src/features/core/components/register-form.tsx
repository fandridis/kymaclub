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
import { getDeviceId } from '../../../utils/storage';
import { checkRateLimit, clearRateLimit, formatTimeRemaining } from '../../../utils/rateLimiter';
import { useTypedTranslation } from '../../../i18n/typed';
import i18n from '../../../i18n';

interface SimpleRegisterFormProps {
    onSuccess?: () => void;
    onBack: () => void;
}

export function RegisterForm({ onSuccess, onBack }: SimpleRegisterFormProps) {
    const navigation = useNavigation();
    const { t } = useTypedTranslation();
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"email" | { email: string }>("email");
    const [submitting, setSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [checkingUser, setCheckingUser] = useState(false);

    const checkUserExistsMutation = useMutation(api.mutations.core.checkUserExistsByEmail);
    const storePendingAuthLanguage = useMutation(api.mutations.core.storePendingAuthLanguage);

    const handleSendCode = async () => {
        if (!email.trim()) {
            Alert.alert(t('auth.register.error'), t('auth.register.errorEnterEmail'));
            return;
        }

        // Check rate limits before proceeding
        const deviceId = getDeviceId();
        const rateLimitResult = checkRateLimit('register', email.trim(), deviceId);

        if (!rateLimitResult.allowed) {
            const timeText = formatTimeRemaining(rateLimitResult.timeUntilReset || 0);
            Alert.alert(
                t('auth.register.tooManyAttempts'),
                t('auth.register.tooManyAttemptsMessage', { time: timeText }),
                [{ text: t('auth.register.ok') }]
            );
            return;
        }

        setCheckingUser(true);

        try {
            // First check if user already exists
            const userExists = await checkUserExistsMutation({ email: email.trim() });

            if (userExists) {
                Alert.alert(
                    t('auth.register.accountExists'),
                    t('auth.register.accountExistsMessage'),
                    [
                        {
                            text: t('auth.register.signInButton'),
                            onPress: () => {
                                // Navigate to sign-in screen
                                navigation.navigate('SignInModal' as never);
                            }
                        },
                        { text: t('auth.register.ok') }
                    ]
                );
                return;
            }

            // User doesn't exist, proceed with OTP registration
            setSubmitting(true);

            // Store language preference for OTP email localization
            try {
                await storePendingAuthLanguage({
                    email: email.trim(),
                    language: i18n.language || 'el',
                });
            } catch (langError) {
                // Non-critical - continue even if this fails
                console.warn('[RegisterForm] Failed to store pending language:', langError);
            }

            // Create FormData equivalent for React Native
            const formData = new FormData();
            formData.append('email', email);

            await signIn("resend-otp", formData);
            setStep({ email });
        } catch (error) {
            Alert.alert(t('auth.register.error'), t('auth.register.errorSendCode'));
        } finally {
            setCheckingUser(false);
            setSubmitting(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code.trim()) {
            Alert.alert(t('auth.register.error'), t('auth.register.errorEnterCode'));
            return;
        }

        setSubmitting(true);

        try {
            // Create FormData with email and code
            const formData = new FormData();
            const emailValue = step === "email" ? email : step.email;
            formData.append('email', emailValue);
            formData.append('code', code);

            await signIn("resend-otp", formData);

            // Registration successful! Clear rate limit for this email
            const deviceId = getDeviceId();
            clearRateLimit('register', email.trim(), deviceId);

            // Note: submitting state will remain true until user state updates and redirect happens
            // This is intentional - the useEffect in create-account-modal-screen will handle navigation

        } catch (error) {
            console.error('[RegisterForm] Verification error:', error);
            Alert.alert(t('auth.register.error'), t('auth.register.errorInvalidCode'));
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
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formContainer}>
                    {step === "email" ? (
                        <>
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>{t('auth.register.title')}</Text>
                                <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('auth.register.emailLabel')}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder={t('auth.register.emailPlaceholder')}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    editable={!submitting && !checkingUser}
                                    returnKeyType="go"
                                    onSubmitEditing={handleSendCode}
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
                                    <Text style={styles.buttonText}>{t('auth.register.button')}</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={onBack}
                                disabled={submitting || checkingUser}
                            >
                                <Text style={styles.backButtonText}>{t('auth.register.back')}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>{t('auth.register.checkEmailTitle')}</Text>
                                <Text style={styles.subtitle}>
                                    {t('auth.register.checkEmailSubtitle', { email: step.email })}
                                </Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('auth.register.verificationCodeLabel')}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={code}
                                    onChangeText={setCode}
                                    placeholder={t('auth.register.verificationCodePlaceholder')}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!submitting}
                                    returnKeyType="go"
                                    onSubmitEditing={handleVerifyCode}
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
                                    <Text style={styles.buttonText}>{t('auth.register.verifyButton')}</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBackToEmail}
                                disabled={submitting}
                            >
                                <Text style={styles.backButtonText}>{t('auth.register.backToEmail')}</Text>
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
