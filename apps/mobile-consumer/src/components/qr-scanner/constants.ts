export const QR_SCANNER_CONFIG = {
    // Scan configuration
    DEFAULT_SCAN_DELAY: 1000, // 1 second delay between scans
    MIN_SCAN_DELAY: 500,
    MAX_SCAN_DELAY: 5000,

    // Camera configuration
    DEFAULT_CAMERA_RATIO: '16:9' as const,
    DEFAULT_CAMERA_TYPE: 'back' as const,

    // Overlay dimensions (percentage of screen)
    OVERLAY_SIZE: 0.7,
    OVERLAY_BORDER_RADIUS: 12,
    OVERLAY_BORDER_WIDTH: 3,

    // Animation durations
    MODAL_ANIMATION_DURATION: 300,
    SCAN_ANIMATION_DURATION: 2000,

    // Colors
    OVERLAY_COLOR: 'rgba(0, 0, 0, 0.6)',
    SCAN_AREA_BORDER_COLOR: '#ff4747',
    ERROR_COLOR: '#FF0000',
    PRIMARY_COLOR: '#ff4747',
    TEXT_COLOR: '#FFFFFF',

    // Messages
    DEFAULT_TITLE: 'Scan QR Code',
    DEFAULT_SUBTITLE: 'Point your camera at a QR code',
    PERMISSION_DENIED_MESSAGE: 'Camera permission is required to scan QR codes',
    CAMERA_NOT_AVAILABLE_MESSAGE: 'Camera is not available on this device',
    SCAN_FAILED_MESSAGE: 'Failed to scan QR code. Please try again.',

    // Supported barcode types (focusing on QR codes but allowing others)
    SUPPORTED_BARCODE_TYPES: ['qr', 'pdf417', 'aztec', 'datamatrix'] as const,
} as const;

export const CAMERA_PERMISSIONS_CONFIG = {
    REQUEST_TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
} as const;