// components/qr-scanner/components/QRScannerControls.tsx

import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { QRScannerControlsProps } from './types';
import { commonStyles } from './styles';
import { CameraOffIcon, FlashlightIcon, XIcon } from 'lucide-react-native';

export const QRScannerControls: React.FC<QRScannerControlsProps> = ({
    onClose,
    onToggleTorch,
    onFlipCamera,
    isTorchEnabled,
    showTorch = true,
    showFlip = true,
    showClose = true,
    closeButtonStyle,
}) => {
    return (
        <>
            {/* Close button */}
            {showClose && (
                <TouchableOpacity
                    style={[commonStyles.closeButton, closeButtonStyle]}
                    onPress={onClose}
                    accessibilityLabel="Close QR scanner"
                    accessibilityRole="button"
                >
                    <XIcon size={24} color="white" />
                </TouchableOpacity>
            )}

            {/* Bottom controls */}
            <View style={commonStyles.controlsContainer}>
                {/* Torch toggle */}
                {showTorch && Platform.OS !== 'web' && (
                    <TouchableOpacity
                        style={[
                            commonStyles.controlButton,
                            isTorchEnabled && commonStyles.controlButtonActive,
                        ]}
                        onPress={onToggleTorch}
                        accessibilityLabel={isTorchEnabled ? 'Turn off torch' : 'Turn on torch'}
                        accessibilityRole="button"
                    >
                        <FlashlightIcon size={24} color="white" />
                    </TouchableOpacity>
                )}

                {/* Camera flip */}
                {showFlip && (
                    <TouchableOpacity
                        style={commonStyles.controlButton}
                        onPress={onFlipCamera}
                        accessibilityLabel="Flip camera"
                        accessibilityRole="button"
                    >
                        <CameraOffIcon size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        </>
    );
};