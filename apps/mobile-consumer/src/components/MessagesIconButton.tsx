import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { MessageCircleIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';
import { theme } from '../theme';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function MessagesIconButton() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { user } = useCurrentUser();

    // Get unread message count for the current user
    const unreadCount = useQuery(
        api.queries.chat.getUnreadMessageCount,
        user ? {} : "skip"
    );

    // Only show badge if we have a valid count > 0
    const hasUnread = typeof unreadCount === 'number' && unreadCount > 0;

    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('Messages')}
            style={styles.messagesButton}
            accessibilityLabel="Open messages"
            accessibilityRole="button"
        >
            <MessageCircleIcon size={22} color={theme.colors.zinc[700]} />
            {hasUnread && typeof unreadCount === 'number' && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : String(unreadCount)}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    messagesButton: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: theme.colors.zinc[100],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -3,
        right: -3,
        backgroundColor: theme.colors.rose[600],
        borderRadius: 8,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 2,
        borderColor: 'white',
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: 'white',
    },
});

