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

interface SignInFormProps {
    onBack?: () => void;
}

export function SignInForm({ onBack }: SignInFormProps = {}) {
    const navigation = useNavigation();
    const { t } = useTypedTranslation();
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
    const [submitting, setSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [checkingUser, setCheckingUser] = useState(false);
    const checkUserExistsMutation = useMutation(api.mutations.core.checkUserExistsByEmail);

    const handleSendCode = async () => {
        if (!email.trim()) {
            Alert.alert(t('auth.signIn.error'), t('auth.signIn.errorEnterEmail'));
            return;
        }

        // Check rate limits before proceeding
        const deviceId = getDeviceId();
        const rateLimitResult = checkRateLimit('login', email.trim(), deviceId);

        if (!rateLimitResult.allowed) {
            const timeText = formatTimeRemaining(rateLimitResult.timeUntilReset || 0);
            Alert.alert(
                t('auth.signIn.tooManyAttempts'),
                t('auth.signIn.tooManyAttemptsMessage', { time: timeText }),
                [{ text: t('auth.signIn.ok') }]
            );
            return;
        }

        setCheckingUser(true);

        try {
            // First check if user exists
            const userExists = await checkUserExistsMutation({ email: email.trim() });

            if (!userExists) {
                Alert.alert(
                    t('auth.signIn.accountNotFound'),
                    t('auth.signIn.accountNotFoundMessage'),
                    [
                        {
                            text: t('auth.signIn.createAccountButton'),
                            onPress: () => {
                                // Navigate to registration screen
                                navigation.navigate('CreateAccountModal' as never);
                            }
                        },
                        { text: t('auth.signIn.ok') }
                    ]
                );
                return;
            }

            // User exists, proceed with OTP
            setSubmitting(true);

            // Create FormData equivalent for React Native
            const formData = new FormData();
            formData.append('email', email);

            await signIn("resend-otp", formData);
            setStep({ email });
        } catch (error) {
            console.error(error);
            Alert.alert(t('auth.signIn.error'), t('auth.signIn.errorSendCode'));
        } finally {
            setCheckingUser(false);
            setSubmitting(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code.trim()) {
            Alert.alert(t('auth.signIn.error'), t('auth.signIn.errorEnterCode'));
            return;
        }

        setSubmitting(true);

        try {
            // Create FormData with email and code
            const formData = new FormData();
            formData.append('email', step === 'signIn' ? email : step.email);
            formData.append('code', code);

            await signIn("resend-otp", formData);

            // Sign in successful! Clear rate limit for this email
            const deviceId = getDeviceId();
            clearRateLimit('login', email.trim(), deviceId);

            // // Sign in successful!
            // // The auth state will update automatically, which will trigger
            // // the navigation structure to switch from auth stack to authenticated stack.
            // // No manual navigation needed!
            // secureStorage.setIsAuthenticated(true);

            // Close the modal (since SignInModal is presented as a modal)
            // navigation.goBack();

        } catch (error) {
            console.error(error);
            Alert.alert(t('auth.signIn.error'), t('auth.signIn.errorInvalidCode'));
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
                                <Text style={styles.title}>{t('auth.signIn.title')}</Text>
                                <Text style={styles.subtitle}>{t('auth.signIn.subtitle')}</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('auth.signIn.emailLabel')}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder={t('auth.signIn.emailPlaceholder')}
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
                                    <Text style={styles.buttonText}>{t('auth.signIn.button')}</Text>
                                )}
                            </TouchableOpacity>

                            {onBack && (
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={onBack}
                                    disabled={submitting || checkingUser}
                                >
                                    <Text style={styles.backButtonText}>{t('auth.signIn.back')}</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <>
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>{t('auth.signIn.checkEmailTitle')}</Text>
                                <Text style={styles.subtitle}>
                                    {t('auth.signIn.checkEmailSubtitle', { email: step.email })}
                                </Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>{t('auth.signIn.verificationCodeLabel')}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={code}
                                    onChangeText={setCode}
                                    placeholder={t('auth.signIn.verificationCodePlaceholder')}
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
                                    <Text style={styles.buttonText}>{t('auth.signIn.button')}</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.outlineButton}
                                onPress={handleBackToSignIn}
                                disabled={submitting}
                            >
                                <Text style={styles.outlineButtonText}>{t('auth.signIn.backToSignIn')}</Text>
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
    backButton: {
        backgroundColor: 'transparent',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
});