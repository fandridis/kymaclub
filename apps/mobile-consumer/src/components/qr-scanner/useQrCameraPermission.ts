// components/qr-scanner/hooks/useCameraPermissions.ts

import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { CameraPermissionState, QRScannerError, QRScannerErrorType } from './types';
import { CAMERA_PERMISSIONS_CONFIG } from './constants';

export const useCameraPermissionsWithRetry = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const [state, setState] = useState<CameraPermissionState>({
        granted: false,
        canAskAgain: true,
        loading: false,
    });

    useEffect(() => {
        if (permission) {
            setState(prev => ({
                ...prev,
                granted: permission.granted,
                canAskAgain: permission.canAskAgain,
                loading: false,
            }));
        }
    }, [permission]);

    const requestPermissionWithRetry = useCallback(async (
        retryCount = 0
    ): Promise<boolean> => {
        if (retryCount >= CAMERA_PERMISSIONS_CONFIG.RETRY_ATTEMPTS) {
            const error = new QRScannerError(
                QRScannerErrorType.PERMISSION_DENIED,
                'Camera permission denied after multiple attempts'
            );
            setState(prev => ({ ...prev, error, loading: false }));
            return false;
        }

        setState(prev => ({ ...prev, loading: true, error: undefined }));

        try {
            const result = await requestPermission();

            if (result.granted) {
                setState(prev => ({
                    ...prev,
                    granted: true,
                    loading: false,
                    error: undefined
                }));
                return true;
            }

            if (!result.canAskAgain) {
                setState(prev => ({
                    ...prev,
                    canAskAgain: false,
                    loading: false
                }));
                showSettingsAlert();
                return false;
            }

            // Retry after delay
            await new Promise(resolve =>
                setTimeout(resolve, CAMERA_PERMISSIONS_CONFIG.RETRY_DELAY)
            );
            return requestPermissionWithRetry(retryCount + 1);

        } catch (error) {
            const qrError = new QRScannerError(
                QRScannerErrorType.PERMISSION_DENIED,
                'Failed to request camera permission',
                error as Error
            );
            setState(prev => ({ ...prev, error: qrError, loading: false }));
            return false;
        }
    }, [requestPermission]);

    const showSettingsAlert = useCallback(() => {
        Alert.alert(
            'Camera Permission Required',
            'To scan QR codes, please enable camera access in your device settings.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Open Settings',
                    onPress: () => {
                        if (Platform.OS === 'ios') {
                            Linking.openURL('app-settings:');
                        } else {
                            Linking.openSettings();
                        }
                    },
                },
            ]
        );
    }, []);

    const checkPermission = useCallback(async (): Promise<boolean> => {
        if (permission?.granted) {
            return true;
        }

        return requestPermissionWithRetry();
    }, [permission?.granted, requestPermissionWithRetry]);

    return {
        ...state,
        checkPermission,
        requestPermission: requestPermissionWithRetry,
        showSettingsAlert,
    };
};