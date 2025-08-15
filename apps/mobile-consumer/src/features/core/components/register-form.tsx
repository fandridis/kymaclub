// components/register-screen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useAuth } from '../../../stores/auth-store';

interface RegisterFormProps {
    onSuccess: () => void;
    onBack: () => void;
}

export function RegisterForm({ onSuccess, onBack }: RegisterFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    //const { signIn } = useAuth(); // Assuming this exists in your auth store

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Invalid email address';
        }

        if (!phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\+?[\d\s-()]+$/.test(phoneNumber)) {
            newErrors.phoneNumber = 'Invalid phone number';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            // Mock registration - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('[RegisterScreen] Registration data:', {
                fullName,
                email,
                phoneNumber,
                password: '***',
            });

            // Mock successful registration
            Alert.alert(
                'Welcome to KymaClub! 🎉',
                'Your account has been created successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // In a real app, you'd sign in the user here
                            onSuccess();
                        },
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Registration Failed', 'Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderInput = (
        placeholder: string,
        value: string,
        onChangeText: (text: string) => void,
        errorKey: string,
        secureTextEntry = false,
        keyboardType: any = 'default'
    ) => (
        <View style={styles.inputContainer}>
            <TextInput
                style={[styles.input, errors[errorKey] && styles.inputError]}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize="none"
                editable={!isLoading}
            />
            {errors[errorKey] && (
                <Text style={styles.errorText}>{errors[errorKey]}</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.icon}>🌊</Text>
                        <Text style={styles.title}>Create Your Account</Text>
                        <Text style={styles.subtitle}>
                            Join KymaClub for premium beach experiences
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedIcon}>✅</Text>
                            <Text style={styles.verifiedText}>Location Verified - Athens Area</Text>
                        </View>

                        {renderInput('Full Name', fullName, setFullName, 'fullName')}
                        {renderInput('Email', email, setEmail, 'email', false, 'email-address')}
                        {renderInput('Phone Number', phoneNumber, setPhoneNumber, 'phoneNumber', false, 'phone-pad')}
                        {renderInput('Password', password, setPassword, 'password', true)}
                        {renderInput('Confirm Password', confirmPassword, setConfirmPassword, 'confirmPassword', true)}

                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                By creating an account, you agree to our{' '}
                                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>
                            </Text>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton, isLoading && styles.disabledButton]}
                            onPress={handleRegister}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={onBack}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>Back</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        maxWidth: 350,
        alignSelf: 'center',
        width: '100%',
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#ddd',
        maxWidth: 350,
        alignSelf: 'center',
        width: '100%',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    verifiedIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    verifiedText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    inputError: {
        borderColor: '#ff6b6b',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 12,
    },
    termsContainer: {
        marginTop: 8,
    },
    termsText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        textDecorationLine: 'underline',
        fontWeight: '500',
        color: '#000',
    },
    buttonContainer: {
        gap: 12,
        maxWidth: 350,
        alignSelf: 'center',
        width: '100%',
    },
    button: {
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#000',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    disabledButton: {
        opacity: 0.7,
    },
});