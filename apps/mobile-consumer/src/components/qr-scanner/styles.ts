// components/qr-scanner/styles/index.ts

import { StyleSheet, Dimensions, Platform } from 'react-native';
import { QR_SCANNER_CONFIG } from './constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const commonStyles = StyleSheet.create({
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Camera styles
    cameraContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    camera: {
        flex: 1,
    },

    // Overlay styles
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: QR_SCANNER_CONFIG.OVERLAY_COLOR,
    },
    scanArea: {
        width: screenWidth * QR_SCANNER_CONFIG.OVERLAY_SIZE,
        height: screenWidth * QR_SCANNER_CONFIG.OVERLAY_SIZE,
        borderRadius: QR_SCANNER_CONFIG.OVERLAY_BORDER_RADIUS,
        borderWidth: QR_SCANNER_CONFIG.OVERLAY_BORDER_WIDTH,
        borderColor: QR_SCANNER_CONFIG.SCAN_AREA_BORDER_COLOR,
        backgroundColor: 'transparent',
    },
    scanAreaAnimated: {
        borderColor: QR_SCANNER_CONFIG.SCAN_AREA_BORDER_COLOR,
        shadowColor: QR_SCANNER_CONFIG.SCAN_AREA_BORDER_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
    },

    // Text styles
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: QR_SCANNER_CONFIG.TEXT_COLOR,
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    subtitleText: {
        fontSize: 16,
        color: QR_SCANNER_CONFIG.TEXT_COLOR,
        textAlign: 'center',
        opacity: 0.8,
        paddingHorizontal: 20,
    },
    textContainer: {
        position: 'absolute',
        top: '20%',
        left: 0,
        right: 0,
        alignItems: 'center',
    },

    // Controls styles
    controlsContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 60 : 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    controlButtonActive: {
        backgroundColor: QR_SCANNER_CONFIG.PRIMARY_COLOR,
        borderColor: QR_SCANNER_CONFIG.PRIMARY_COLOR,
    },
    controlButtonText: {
        color: QR_SCANNER_CONFIG.TEXT_COLOR,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },

    // Close button styles
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    closeButtonText: {
        color: QR_SCANNER_CONFIG.TEXT_COLOR,
        fontSize: 18,
        fontWeight: 'bold',
    },

    // Loading styles
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: QR_SCANNER_CONFIG.TEXT_COLOR,
        fontSize: 16,
        marginTop: 16,
    },

    // Error styles
    errorContainer: {
        position: 'absolute',
        bottom: 150,
        left: 20,
        right: 20,
        backgroundColor: QR_SCANNER_CONFIG.ERROR_COLOR,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    errorText: {
        color: QR_SCANNER_CONFIG.TEXT_COLOR,
        fontSize: 14,
        textAlign: 'center',
    },

    // Permission styles
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        paddingHorizontal: 40,
    },
    permissionIcon: {
        width: 80,
        height: 80,
        marginBottom: 24,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: QR_SCANNER_CONFIG.TEXT_COLOR,
        textAlign: 'center',
        marginBottom: 16,
    },
    permissionMessage: {
        fontSize: 16,
        color: QR_SCANNER_CONFIG.TEXT_COLOR,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        opacity: 0.8,
    },
    permissionButton: {
        backgroundColor: QR_SCANNER_CONFIG.PRIMARY_COLOR,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 8,
        minWidth: 160,
    },
    permissionButtonText: {
        color: QR_SCANNER_CONFIG.TEXT_COLOR,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

// Create a transparent hole in the overlay for the scan area
export const createOverlayMask = () => {
    const scanAreaSize = screenWidth * QR_SCANNER_CONFIG.OVERLAY_SIZE;
    const scanAreaLeft = (screenWidth - scanAreaSize) / 2;
    const scanAreaTop = (screenHeight - scanAreaSize) / 2;

    return {
        scanAreaLeft,
        scanAreaTop,
        scanAreaSize,
    };
};