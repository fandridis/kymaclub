import { ViewStyle } from 'react-native';

export interface QRScanResult {
    data: string;
    type: string;
    bounds?: {
        origin: { x: number; y: number };
        size: { width: number; height: number };
    };
    timestamp: number;
}

export interface QRScannerProps {
    isVisible: boolean;
    onScan: (result: QRScanResult) => void;
    onClose: () => void;
    onError?: (error: QRScannerError) => void;
    title?: string;
    subtitle?: string;
    enableTorch?: boolean;
    enableFlip?: boolean;
    vibrationEnabled?: boolean;
    beepEnabled?: boolean;
    scanDelay?: number; // Delay between scans in milliseconds
    overlayStyle?: ViewStyle;
    showCloseButton?: boolean;
    closeButtonStyle?: ViewStyle;
    validator?: (data: string) => boolean | Promise<boolean>;
}

export interface QRScannerModalProps extends QRScannerProps {
    animationType?: 'slide' | 'fade' | 'none';
    transparent?: boolean;
}

export interface QRScannerOverlayProps {
    title?: string;
    subtitle?: string;
    isScanning: boolean;
    overlayStyle?: ViewStyle;
}

export interface QRScannerControlsProps {
    onClose: () => void;
    onToggleTorch: () => void;
    onFlipCamera: () => void;
    isTorchEnabled: boolean;
    showTorch: boolean;
    showFlip: boolean;
    showClose: boolean;
    closeButtonStyle?: ViewStyle;
}

export enum QRScannerErrorType {
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    CAMERA_NOT_AVAILABLE = 'CAMERA_NOT_AVAILABLE',
    SCAN_FAILED = 'SCAN_FAILED',
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class QRScannerError extends Error {
    type: QRScannerErrorType;
    originalError?: Error;

    constructor(
        type: QRScannerErrorType,
        message: string,
        originalError?: Error
    ) {
        super(message);
        this.type = type;
        this.originalError = originalError;
        this.name = 'QRScannerError';
    }
}

export interface CameraPermissionState {
    granted: boolean;
    canAskAgain: boolean;
    loading: boolean;
    error?: QRScannerError;
}

export interface QRScannerState {
    isScanning: boolean;
    isTorchEnabled: boolean;
    facing: 'front' | 'back';
    lastScanTime: number;
    error?: QRScannerError;
}