// components/qr-scanner/index.ts

// Main components
export { QRScanner } from './qr-scanner';
export { QRScannerModal } from './qr-scanner-modal';

// Sub-components (for advanced usage)
export { QRScannerOverlay } from './qr-scanner-overlay';
export { QRScannerControls } from './qr-scanner-controls';
export { LoadingSpinner } from './loading-spinner';

// Hooks
export { useQRScanner } from './use-qr-scanner';
export { useCameraPermissionsWithRetry } from './useQrCameraPermission';

// Types
export type {
    QRScanResult,
    QRScannerProps,
    QRScannerModalProps,
    QRScannerOverlayProps,
    QRScannerControlsProps,
    QRScannerState,
    CameraPermissionState,
} from './types';

export {
    QRScannerError,
    QRScannerErrorType,
} from './types';

// Utilities
export { QRValidator, CommonValidators, processQRScanResult } from './qr-validator';
export { QR_SCANNER_CONFIG, CAMERA_PERMISSIONS_CONFIG } from './constants';

// Styles (for customization)
export { commonStyles, createOverlayMask } from './styles';