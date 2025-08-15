// components/qr-scanner/QRScannerModal.tsx

import React from 'react';
import { Modal } from 'react-native';
import { QRScannerModalProps } from './types';
import { QRScanner } from './qr-scanner';

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
    animationType = 'slide',
    transparent = false,
    ...qrScannerProps
}) => {
    return (
        <Modal
            visible={qrScannerProps.isVisible}
            animationType={animationType}
            transparent={transparent}
            presentationStyle="fullScreen"
            statusBarTranslucent
        >
            <QRScanner {...qrScannerProps} />
        </Modal>
    );
};