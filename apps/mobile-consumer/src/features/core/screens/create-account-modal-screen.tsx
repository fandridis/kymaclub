// create-account-modal-screen.tsx
import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { LocationGate } from '../components/location-gate';
import { WaitlistData, WaitlistForm } from '../components/waitlist-form';
import { RegisterForm } from '../components/register-form';
import { useTypedTranslation } from '../../../i18n/typed';
import { HeaderLanguageSwitcher } from '../../../components/HeaderLanguageSwitcher';

type FlowState = 'location-check' | 'register' | 'waitlist';

/**
 * Create Account Modal Screen
 * 
 * No manual redirect logic needed - conditional screen rendering handles navigation:
 * - This screen is only shown in the unauthenticated group
 * - When user authenticates, the screen automatically disappears
 * - The appropriate screen (Onboarding or News) is shown automatically
 */
export function CreateAccountModalScreen() {
    const navigation = useNavigation();
    const { t } = useTypedTranslation();
    const [flowState, setFlowState] = useState<FlowState>('location-check');
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [serviceAreaCheck, setServiceAreaCheck] = useState<any>(null);

    const handleLocationVerified = () => {
        setFlowState('register');
    };

    const handleLocationDenied = (location: Location.LocationObject, areaCheck: any) => {
        setUserLocation(location);
        setServiceAreaCheck(areaCheck);
        setFlowState('waitlist');
    };

    const handleWaitlistSubmit = async (data: WaitlistData) => {
        try {
            // Mock submission
            await new Promise(resolve => setTimeout(resolve, 1000));

            Alert.alert(
                t('auth.waitlist.welcomeTitle'),
                t('auth.waitlist.welcomeMessage', { email: data.email, city: data.selectedCity }),
                [{
                    text: t('auth.waitlist.ok'),
                    onPress: () => navigation.goBack()
                }]
            );
        } catch (error) {
            console.error('[CreateAccountModal] Waitlist submission error:', error);
            throw error;
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const renderContent = () => {
        switch (flowState) {
            case 'location-check':
                return (
                    <LocationGate
                        onLocationVerified={handleLocationVerified}
                        onLocationDenied={handleLocationDenied}
                        onBack={handleBack}
                    />
                );

            case 'register':
                return (
                    <RegisterForm
                        onBack={handleBack}
                    />
                );

            case 'waitlist':
                return (
                    <WaitlistForm
                        userLocation={userLocation}
                        serviceAreaCheck={serviceAreaCheck}
                        onSubmit={handleWaitlistSubmit}
                        onBack={handleBack}
                    />
                );
        }
    };

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
                    {renderContent()}
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
    },
});
