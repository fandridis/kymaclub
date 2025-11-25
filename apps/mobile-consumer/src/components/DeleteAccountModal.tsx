import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { XIcon, AlertTriangleIcon } from 'lucide-react-native';
import { theme } from '../theme';
import { useTypedTranslation } from '../i18n/typed';

interface DeleteAccountModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
    isVisible,
    onClose,
    onConfirm
}) => {
    const { t } = useTypedTranslation();
    const [confirmText, setConfirmText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get the required confirmation text from translations
    const REQUIRED_TEXT = t('settings.account.deletePlaceholder');

    const handleConfirm = async () => {
        if (confirmText !== REQUIRED_TEXT) return;

        setIsSubmitting(true);
        try {
            await onConfirm();
            // Modal will be closed by parent or navigation will happen
        } catch (error) {
            console.error('Delete account error:', error);
            Alert.alert(t('common.error'), t('errors.somethingWentWrong'));
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setConfirmText('');
            setIsSubmitting(false);
            onClose();
        }
    };

    const isMatch = confirmText === REQUIRED_TEXT;

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft} />
                    <Text style={styles.headerTitle}>{t('settings.account.deleteAccount')}</Text>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={styles.closeButton}
                        disabled={isSubmitting}
                    >
                        <XIcon size={24} color={theme.colors.zinc[600]} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.warningContainer}>
                        <View style={styles.iconContainer}>
                            <AlertTriangleIcon size={48} color="#ef4444" />
                        </View>
                        <Text style={styles.warningTitle}>{t('settings.account.deleteDescription')}</Text>
                        <Text style={styles.warningText}>
                            {t('settings.account.deleteConfirmationWarning')}
                        </Text>
                        <Text style={styles.warningNote}>
                            {t('settings.account.deleteTimelineInfo')}
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.instructionText}>
                            {(() => {
                                const instruction = t('settings.account.deleteInstruction', { text: REQUIRED_TEXT });
                                const parts = instruction.split('<bold>');
                                return parts.map((part, index) => {
                                    if (part.includes('</bold>')) {
                                        const [boldText, rest] = part.split('</bold>');
                                        return (
                                            <React.Fragment key={index}>
                                                <Text style={styles.boldText}>{boldText}</Text>
                                                {rest}
                                            </React.Fragment>
                                        );
                                    }
                                    return part;
                                });
                            })()}
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={confirmText}
                            onChangeText={setConfirmText}
                            placeholder={REQUIRED_TEXT}
                            placeholderTextColor={theme.colors.zinc[400]}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isSubmitting}
                        />
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.deleteButton,
                            (!isMatch || isSubmitting) && styles.deleteButtonDisabled
                        ]}
                        onPress={handleConfirm}
                        disabled={!isMatch || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.deleteButtonText}>{t('settings.account.deleteAccount')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.zinc[100],
    },
    headerLeft: {
        width: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.zinc[900],
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.zinc[100],
    },
    content: {
        flex: 1,
        padding: 24,
    },
    warningContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    warningTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.zinc[900],
        marginBottom: 8,
        textAlign: 'center',
    },
    warningText: {
        fontSize: 15,
        color: theme.colors.zinc[600],
        textAlign: 'center',
        lineHeight: 22,
    },
    warningNote: {
        marginTop: 12,
        fontSize: 14,
        color: theme.colors.zinc[500],
        textAlign: 'center',
        lineHeight: 20,
    },
    inputContainer: {
        width: '100%',
    },
    instructionText: {
        fontSize: 14,
        color: theme.colors.zinc[700],
        marginBottom: 12,
    },
    boldText: {
        fontWeight: '700',
        color: theme.colors.zinc[900],
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: theme.colors.zinc[300],
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: theme.colors.zinc[900],
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: theme.colors.zinc[100],
    },
    deleteButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonDisabled: {
        backgroundColor: theme.colors.zinc[300],
    },
    deleteButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
