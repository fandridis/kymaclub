// components/create-account-modal.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { LocationGate } from '../components/location-gate';
import { WaitlistData, WaitlistForm } from '../components/waitlist-form';
import { checkServiceAreaAccess } from '../../../utils/location';
import { RegisterForm } from '../components/register-form';

type FlowState = 'location-check' | 'register' | 'waitlist';

export function CreateAccountModalScreen() {
    const navigation = useNavigation();
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
                'Welcome to the Waitlist! 🎉',
                `Thanks for joining! We'll notify you at ${data.email} when we launch in ${data.selectedCity}.`,
                [{
                    text: 'OK',
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
                        onSuccess={() => {
                            // Registration successful, close modal
                            navigation.goBack();
                        }}
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
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <X size={24} color="#333" />
                    </TouchableOpacity>
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
    },
});