import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScanQrCodeIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export function ScanScreen() {
    const navigation = useNavigation();


    return (
        <View style={styles.container}>
            <Text style={styles.title}>QR Scanner</Text>
            <Text style={styles.subtitle}>Scan QR codes for quick check-in</Text>

            {/* Scan button */}
            <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('QRScannerModal' as never)}
            >
                <ScanQrCodeIcon size={32} color="white" />
                <Text style={styles.scanButtonText}>
                    Scan QR Code
                </Text>
            </TouchableOpacity>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>How to use:</Text>
                <Text style={styles.instructionsText}>
                    • Tap the scan button above{'\n'}
                    • Point your camera at any QR code{'\n'}
                    • The result will be processed automatically
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1a1a1a',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6c757d',
        marginBottom: 40,
        textAlign: 'center',
    },
    scanButton: {
        backgroundColor: '#ff4747',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 30,
    },
    scanButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        marginLeft: 16,
    },
    instructionsContainer: {
        width: '100%',
        padding: 20,
        backgroundColor: '#e9ecef',
        borderRadius: 12,
        marginTop: 'auto',
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#495057',
    },
    instructionsText: {
        fontSize: 14,
        color: '#6c757d',
        lineHeight: 20,
    },
}); 