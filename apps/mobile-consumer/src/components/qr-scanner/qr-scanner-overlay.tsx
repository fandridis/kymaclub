// components/qr-scanner/components/QRScannerOverlay.tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { QRScannerOverlayProps } from './types';
import { commonStyles, createOverlayMask } from './styles';
import { QR_SCANNER_CONFIG } from './constants';

export const QRScannerOverlay: React.FC<QRScannerOverlayProps> = ({
    title = QR_SCANNER_CONFIG.DEFAULT_TITLE,
    subtitle = QR_SCANNER_CONFIG.DEFAULT_SUBTITLE,
    isScanning,
    overlayStyle,
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const { scanAreaLeft, scanAreaTop, scanAreaSize } = createOverlayMask();

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: QR_SCANNER_CONFIG.SCAN_ANIMATION_DURATION,
                    useNativeDriver: false,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: QR_SCANNER_CONFIG.SCAN_ANIMATION_DURATION,
                    useNativeDriver: false,
                }),
            ])
        );

        if (isScanning) {
            animation.start();
        } else {
            animation.stop();
            animatedValue.setValue(0);
        }

        return () => animation.stop();
    }, [isScanning, animatedValue]);

    const scanLinePosition = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, scanAreaSize - 4],
    });

    const scanLineOpacity = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 1, 0.3],
    });

    return (
        <View style={[commonStyles.overlayContainer, overlayStyle]}>
            {/* Background overlay */}
            <View style={commonStyles.overlayBackground} />

            {/* Title and subtitle */}
            <View style={commonStyles.textContainer}>
                <Text style={commonStyles.titleText}>{title}</Text>
                <Text style={commonStyles.subtitleText}>{subtitle}</Text>
            </View>

            {/* Scan area with transparent center */}
            <View
                style={[
                    commonStyles.scanArea,
                    {
                        position: 'absolute',
                        left: scanAreaLeft,
                        top: scanAreaTop,
                    },
                    isScanning && commonStyles.scanAreaAnimated,
                ]}
            >
                {/* Corner indicators */}
                <View style={cornerStyles.topLeft} />
                <View style={cornerStyles.topRight} />
                <View style={cornerStyles.bottomLeft} />
                <View style={cornerStyles.bottomRight} />

                {/* Animated scan line */}
                {isScanning && (
                    <Animated.View
                        style={[
                            scanLineStyles.container,
                            {
                                top: scanLinePosition,
                                opacity: scanLineOpacity,
                            },
                        ]}
                    >
                        <View style={scanLineStyles.line} />
                    </Animated.View>
                )}
            </View>

            {/* Mask to create transparent center */}
            <View style={maskStyles.container}>
                {/* Top mask */}
                <View
                    style={[
                        maskStyles.section,
                        {
                            top: 0,
                            left: 0,
                            right: 0,
                            height: scanAreaTop,
                        },
                    ]}
                />

                {/* Bottom mask */}
                <View
                    style={[
                        maskStyles.section,
                        {
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: scanAreaTop,
                        },
                    ]}
                />

                {/* Left mask */}
                <View
                    style={[
                        maskStyles.section,
                        {
                            top: scanAreaTop,
                            left: 0,
                            width: scanAreaLeft,
                            height: scanAreaSize,
                        },
                    ]}
                />

                {/* Right mask */}
                <View
                    style={[
                        maskStyles.section,
                        {
                            top: scanAreaTop,
                            right: 0,
                            width: scanAreaLeft,
                            height: scanAreaSize,
                        },
                    ]}
                />
            </View>
        </View>
    );
};

// Corner indicator styles
const cornerStyles = {
    topLeft: {
        position: 'absolute' as const,
        top: -3,
        left: -3,
        width: 30,
        height: 30,
        borderTopWidth: 6,
        borderLeftWidth: 6,
        borderColor: QR_SCANNER_CONFIG.SCAN_AREA_BORDER_COLOR,
    },
    topRight: {
        position: 'absolute' as const,
        top: -3,
        right: -3,
        width: 30,
        height: 30,
        borderTopWidth: 6,
        borderRightWidth: 6,
        borderColor: QR_SCANNER_CONFIG.SCAN_AREA_BORDER_COLOR,
    },
    bottomLeft: {
        position: 'absolute' as const,
        bottom: -3,
        left: -3,
        width: 30,
        height: 30,
        borderBottomWidth: 6,
        borderLeftWidth: 6,
        borderColor: QR_SCANNER_CONFIG.SCAN_AREA_BORDER_COLOR,
    },
    bottomRight: {
        position: 'absolute' as const,
        bottom: -3,
        right: -3,
        width: 30,
        height: 30,
        borderBottomWidth: 6,
        borderRightWidth: 6,
        borderColor: QR_SCANNER_CONFIG.SCAN_AREA_BORDER_COLOR,
    },
};

// Scan line styles
const scanLineStyles = {
    container: {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        height: 4,
    },
    line: {
        height: 2,
        backgroundColor: QR_SCANNER_CONFIG.SCAN_AREA_BORDER_COLOR,
        borderRadius: 1,
        shadowColor: QR_SCANNER_CONFIG.SCAN_AREA_BORDER_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
};

// Mask styles for creating transparent center
const maskStyles = {
    container: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    section: {
        position: 'absolute' as const,
        backgroundColor: QR_SCANNER_CONFIG.OVERLAY_COLOR,
    },
};