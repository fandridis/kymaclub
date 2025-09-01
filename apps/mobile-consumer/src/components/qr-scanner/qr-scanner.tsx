// components/qr-scanner/QRScanner.tsx

import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { BarcodeType, CameraView } from 'expo-camera';
import { QRScannerProps, QRScannerError, QRScannerErrorType } from './types';
import { useQRScanner } from './use-qr-scanner';
import { useCameraPermissionsWithRetry } from './useQrCameraPermission';
import { QRScannerOverlay } from './qr-scanner-overlay';
import { QRScannerControls } from './qr-scanner-controls';
import { LoadingSpinner } from './loading-spinner';
import { commonStyles } from './styles';
import { QR_SCANNER_CONFIG } from './constants';
import { CameraIcon, XIcon } from 'lucide-react-native';

export const QRScanner: React.FC<QRScannerProps> = ({
    isVisible,
    onScan,
    onClose,
    onError,
    title,
    subtitle,
    enableTorch = true,
    enableFlip = true,
    vibrationEnabled = true,
    beepEnabled = true,
    scanDelay = QR_SCANNER_CONFIG.DEFAULT_SCAN_DELAY,
    overlayStyle,
    showCloseButton = true,
    closeButtonStyle,
    validator,
}) => {
    const {
        granted: hasPermission,
        loading: permissionLoading,
        error: permissionError,
        checkPermission,
        showSettingsAlert,
    } = useCameraPermissionsWithRetry();

    const {
        state,
        handleBarcodeScan,
        toggleTorch,
        flipCamera,
        startScanning,
        stopScanning,
        resetScanner,
        cleanup,
    } = useQRScanner({
        onScan,
        onError,
        validator,
        scanDelay,
        vibrationEnabled,
        beepEnabled,
    });

    // Handle visibility changes
    useEffect(() => {
        if (isVisible) {
            checkPermission().then((granted) => {
                if (granted) {
                    startScanning();
                }
            });
        } else {
            stopScanning();
            resetScanner();
        }

        return () => {
            if (isVisible) {
                cleanup();
            }
        };
    }, [isVisible, checkPermission, startScanning, stopScanning, resetScanner, cleanup]);

    // Handle close
    const handleClose = useCallback(() => {
        stopScanning();
        onClose();
    }, [stopScanning, onClose]);

    // Handle camera mount error
    const handleCameraMountError = useCallback((error: any) => {
        const qrError = new QRScannerError(
            QRScannerErrorType.CAMERA_NOT_AVAILABLE,
            'Camera failed to initialize',
            error
        );

        if (onError) {
            onError(qrError);
        } else {
            console.error('Camera mount error:', error);
        }
    }, [onError]);

    if (!isVisible) {
        return null;
    }

    // Permission loading state
    if (permissionLoading) {
        return (
            <View style={commonStyles.modalContainer}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <View style={commonStyles.permissionContainer}>
                    <LoadingSpinner visible={true} message="Requesting camera permission..." />
                </View>
            </View>
        );
    }

    // Permission denied state
    if (!hasPermission) {
        return (
            <View style={commonStyles.modalContainer}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <View style={commonStyles.permissionContainer}>
                    <CameraIcon size={80} color="white" style={commonStyles.permissionIcon} />
                    <Text style={commonStyles.permissionTitle}>Camera Access Required</Text>
                    <Text style={commonStyles.permissionMessage}>
                        {permissionError?.message || QR_SCANNER_CONFIG.PERMISSION_DENIED_MESSAGE}
                    </Text>
                    <TouchableOpacity
                        style={commonStyles.permissionButton}
                        onPress={showSettingsAlert}
                        accessibilityLabel="Open settings"
                        accessibilityRole="button"
                    >
                        <Text style={commonStyles.permissionButtonText}>Open Settings</Text>
                    </TouchableOpacity>
                    {showCloseButton && (
                        <TouchableOpacity
                            style={[commonStyles.closeButton, closeButtonStyle]}
                            onPress={handleClose}
                            accessibilityLabel="Close scanner"
                            accessibilityRole="button"
                        >
                            <XIcon size={24} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={commonStyles.modalContainer}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Camera view */}
            <View style={commonStyles.cameraContainer}>
                <CameraView
                    style={commonStyles.camera}
                    facing={state.facing}
                    enableTorch={state.isTorchEnabled && enableTorch}
                    onBarcodeScanned={handleBarcodeScan}
                    onMountError={handleCameraMountError}
                    barcodeScannerSettings={{
                        barcodeTypes: QR_SCANNER_CONFIG.SUPPORTED_BARCODE_TYPES as unknown as BarcodeType[],
                    }}
                />

                {/* Overlay */}
                <QRScannerOverlay
                    title={title}
                    subtitle={subtitle}
                    isScanning={state.isScanning}
                    overlayStyle={overlayStyle}
                />

                {/* Controls */}
                <QRScannerControls
                    onClose={handleClose}
                    onToggleTorch={toggleTorch}
                    onFlipCamera={flipCamera}
                    isTorchEnabled={state.isTorchEnabled}
                    showTorch={enableTorch && Platform.OS !== 'web'}
                    showFlip={enableFlip}
                    showClose={showCloseButton}
                    closeButtonStyle={closeButtonStyle}
                />

                {/* Error display */}
                {state.error && (
                    <View style={commonStyles.errorContainer}>
                        <Text style={commonStyles.errorText}>
                            {state.error.message}
                        </Text>
                    </View>
                )}

                {/* Loading spinner for scanning state */}
                <LoadingSpinner
                    visible={state.isScanning && !state.error}
                    message="Scanning..."
                />
            </View>
        </View>
    );
};  