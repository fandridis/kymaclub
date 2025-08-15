// components/qr-scanner/hooks/useQRScanner.ts

import { useState, useCallback, useRef } from 'react';
import { Vibration, Platform } from 'react-native';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { BarcodeScanningResult } from 'expo-camera';
import {
    QRScannerState,
    QRScanResult,
    QRScannerError,
    QRScannerErrorType
} from './types';
import { processQRScanResult } from './qr-validator';
import { QR_SCANNER_CONFIG } from './constants';

interface UseQRScannerOptions {
    onScan: (result: QRScanResult) => void;
    onError?: (error: QRScannerError) => void;
    validator?: (data: string) => boolean | Promise<boolean>;
    scanDelay?: number;
    vibrationEnabled?: boolean;
    beepEnabled?: boolean;
}

export const useQRScanner = ({
    onScan,
    onError,
    validator,
    scanDelay = QR_SCANNER_CONFIG.DEFAULT_SCAN_DELAY,
    vibrationEnabled = true,
    beepEnabled = true,
}: UseQRScannerOptions) => {
    const [state, setState] = useState<QRScannerState>({
        isScanning: false,
        isTorchEnabled: false,
        facing: 'back',
        lastScanTime: 0,
    });

    const audioPlayerRef = useRef<AudioPlayer | null>(null);
    const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize beep sound
    const initializeBeepSound = useCallback(async () => {
        if (!beepEnabled || audioPlayerRef.current) return;

        try {
            // Create an audio player with the beep sound file
            const player = createAudioPlayer(require('./../../assets/beep.mp3'));
            audioPlayerRef.current = player;

        } catch (error) {
            console.warn('Failed to initialize beep sound:', error);
        }
    }, [beepEnabled]);

    // Play feedback on successful scan
    const playFeedback = useCallback(async () => {
        try {
            // Vibration feedback
            if (vibrationEnabled && Platform.OS !== 'web') {
                Vibration.vibrate(100);
            }

            // Audio feedback
            if (beepEnabled && audioPlayerRef.current) {
                try {
                    // Reset to beginning and play the sound
                    audioPlayerRef.current.seekTo(0);
                    audioPlayerRef.current.play();
                } catch (audioError) {
                    console.warn('Failed to play beep sound:', audioError);
                }
            }
        } catch (error) {
            console.warn('Failed to play feedback:', error);
        }
    }, [vibrationEnabled, beepEnabled]);

    // Handle barcode scan
    const handleBarcodeScan = useCallback(async (
        scanningResult: BarcodeScanningResult
    ) => {
        const now = Date.now();

        // Prevent rapid consecutive scans
        if (now - state.lastScanTime < scanDelay) {
            return;
        }

        setState(prev => ({
            ...prev,
            lastScanTime: now,
            isScanning: true
        }));

        try {
            // Process and validate the scan result
            const qrResult = await processQRScanResult(scanningResult, validator);

            // Play feedback
            await playFeedback();

            // Call the onScan callback
            onScan(qrResult);

            setState(prev => ({ ...prev, isScanning: false, error: undefined }));

        } catch (error) {
            const qrError = error instanceof QRScannerError
                ? error
                : new QRScannerError(
                    QRScannerErrorType.SCAN_FAILED,
                    'Failed to process QR code',
                    error as Error
                );

            setState(prev => ({ ...prev, isScanning: false, error: qrError }));

            if (onError) {
                onError(qrError);
            }
        }
    }, [state.lastScanTime, scanDelay, validator, onScan, onError, playFeedback]);

    // Toggle torch
    const toggleTorch = useCallback(() => {
        setState(prev => ({
            ...prev,
            isTorchEnabled: !prev.isTorchEnabled
        }));
    }, []);

    // Flip camera
    const flipCamera = useCallback(() => {
        setState(prev => ({
            ...prev,
            facing: prev.facing === 'back' ? 'front' : 'back',
            isTorchEnabled: false // Disable torch when flipping to front camera
        }));
    }, []);

    // Start scanning
    const startScanning = useCallback(() => {
        setState(prev => ({ ...prev, isScanning: true, error: undefined }));
        initializeBeepSound();
    }, [initializeBeepSound]);

    // Stop scanning
    const stopScanning = useCallback(() => {
        setState(prev => ({ ...prev, isScanning: false }));

        if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = null;
        }
    }, []);

    // Reset scanner state
    const resetScanner = useCallback(() => {
        setState({
            isScanning: false,
            isTorchEnabled: false,
            facing: 'back',
            lastScanTime: 0,
        });
    }, []);

    // Cleanup
    const cleanup = useCallback(async () => {
        stopScanning();

        if (audioPlayerRef.current) {
            audioPlayerRef.current.remove();
            audioPlayerRef.current = null;
        }
    }, [stopScanning]);

    return {
        state,
        handleBarcodeScan,
        toggleTorch,
        flipCamera,
        startScanning,
        stopScanning,
        resetScanner,
        cleanup,
    };
};