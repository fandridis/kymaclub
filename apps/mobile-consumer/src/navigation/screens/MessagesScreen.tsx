import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, NavigationProp } from '@react-navigation/native';
import { MessageCircleIcon, ChevronRightIcon, TrashIcon } from 'lucide-react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { TabScreenHeader } from '../../components/TabScreenHeader';
import { theme } from '../../theme';
import type { RootStackParamList } from '../index';
import type { Doc } from '@repo/api/convex/_generated/dataModel';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

// Utility function to format timestamp
function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

interface MessageThreadItemProps {
  thread: Doc<"chatMessageThreads">;
  venueImage?: string;
  onPress: () => void;
  onDelete?: () => void;
}

function SwipeableThreadItem({
  thread,
  venueImage,
  onPress,
  onDelete
}: MessageThreadItemProps) {
  const translateX = useSharedValue(0);
  const DELETE_THRESHOLD = -80;

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow swiping left (negative values) or right when delete is revealed
      const newValue = event.translationX;
      
      // If delete is currently revealed (translateX is at DELETE_THRESHOLD)
      if (translateX.value <= DELETE_THRESHOLD + 5) {
        // Allow swiping right to close, but cap at 0
        translateX.value = Math.min(0, Math.max(DELETE_THRESHOLD, newValue));
      } else {
        // Normal left swipe behavior when delete is not revealed
        translateX.value = Math.min(0, Math.max(DELETE_THRESHOLD, newValue));
      }
    })
    .onEnd(() => {
      const REVEAL_THRESHOLD = DELETE_THRESHOLD * 0.5; // -40px to reveal
      const HIDE_THRESHOLD = DELETE_THRESHOLD * 0.25;  // -20px to hide when revealed
      
      // Check if delete is currently revealed
      const isCurrentlyRevealed = translateX.value <= DELETE_THRESHOLD + 5;
      
      if (isCurrentlyRevealed) {
        // Delete is revealed: need significant swipe right to hide it
        const shouldHide = translateX.value > HIDE_THRESHOLD;
        
        if (shouldHide) {
          // Hide the delete button
          translateX.value = withSpring(0);
        } else {
          // Stay revealed - snap back
          translateX.value = withSpring(DELETE_THRESHOLD);
        }
      } else {
        // Delete is not revealed: normal reveal behavior
        const shouldReveal = translateX.value < REVEAL_THRESHOLD;
        
        if (shouldReveal) {
          // Reveal the delete button
          translateX.value = withSpring(DELETE_THRESHOLD);
        } else {
          // Spring back to normal position
          translateX.value = withSpring(0);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const deleteButtonStyle = useAnimatedStyle(() => {
    const opacity = translateX.value < -20 ? 1 : 0;
    return {
      opacity: withSpring(opacity),
    };
  });

  const handleDeletePress = () => {
    // Reset swipe position first
    translateX.value = withSpring(0);
    // Then trigger delete confirmation
    if (onDelete) {
      onDelete();
    }
  };

  const handleItemPress = () => {
    // If delete is revealed, hide it first
    if (translateX.value < -10) {
      translateX.value = withSpring(0);
    } else {
      // Otherwise, handle the normal press
      onPress();
    }
  };

  return (
    <View style={styles.swipeableContainer}>
      {/* Delete button background */}
      <ReAnimated.View style={[styles.deleteBackground, deleteButtonStyle]}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress} activeOpacity={0.8}>
          <TrashIcon size={24} color="white" strokeWidth={2} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </ReAnimated.View>

      {/* Swipeable thread item */}
      <GestureDetector gesture={panGesture}>
        <ReAnimated.View style={[styles.swipeableItem, animatedStyle]}>
          <MessageThreadItem
            thread={thread}
            venueImage={venueImage}
            onPress={handleItemPress}
          />
        </ReAnimated.View>
      </GestureDetector>
    </View>
  );
}

function MessageThreadItem({
  thread,
  venueImage,
  onPress
}: MessageThreadItemProps) {
  const unreadCount = thread.unreadCountConsumer || 0;
  const venueName = thread.venueSnapshot.name;
  const lastMessage = thread.lastMessagePreview || 'No messages yet';
  const timestamp = formatMessageTime(thread.lastMessageAt);

  return (
    <TouchableOpacity style={styles.threadItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.threadContent}>
        <View style={styles.avatarContainer}>
          {venueImage ? (
            <Image
              source={{ uri: venueImage }}
              style={styles.venueAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.venueAvatar, styles.placeholderAvatar]}>
              <Text style={styles.placeholderText}>
                {venueName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.venueName} numberOfLines={1}>
              {venueName}
            </Text>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>

          <Text
            style={[
              styles.lastMessage,
              unreadCount > 0 && styles.lastMessageUnread
            ]}
            numberOfLines={2}
          >
            {lastMessage}
          </Text>
        </View>

        <View style={styles.threadMeta}>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
          <ChevronRightIcon size={16} color={theme.colors.zinc[400]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function MessagesScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  // Fetch message threads
  const messageThreads = useQuery(api.queries.chat.getUserMessageThreads, {
    paginationOpts: { numItems: 50, cursor: null }
  });

  // Get total unread count
  const unreadCountQuery = useQuery(api.queries.chat.getUnreadMessageCount, {});
  const totalUnreadCount = unreadCountQuery || 0;

  // Delete thread mutation
  const deleteThreadMutation = useMutation(api.mutations.chat.deleteThread);

  const handleThreadPress = (thread: Doc<"chatMessageThreads">, venueImage?: string) => {
    navigation.navigate('Conversation', {
      threadId: thread._id,
      venueName: thread.venueSnapshot.name,
      venueImage,
    });
  };

  const handleDeleteThread = (thread: Doc<"chatMessageThreads">) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete your conversation with ${thread.venueSnapshot.name}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingThreadId(thread._id);
              await deleteThreadMutation({ threadId: thread._id });
            } catch (error) {
              console.error('Failed to delete thread:', error);
              Alert.alert('Error', 'Failed to delete conversation. Please try again.');
            } finally {
              setDeletingThreadId(null);
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (messageThreads === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <TabScreenHeader title="Messages" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.emerald[500]} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const threads = messageThreads.page || [];

  return (
    <SafeAreaView style={styles.container}>
      <TabScreenHeader title="Messages" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Message Threads */}
        <View style={styles.threadsContainer}>
          {threads.length > 0 ? (
            threads.map((thread, index) => (
              <SwipeableThreadItem
                key={thread._id}
                thread={thread}
                onPress={() => handleThreadPress(thread)}
                onDelete={() => handleDeleteThread(thread)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MessageCircleIcon size={48} color={theme.colors.zinc[400]} />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Messages from venues will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },

  // Threads container
  threadsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Thread item
  threadItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.zinc[100],
  },
  threadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    marginRight: 10,
  },
  venueAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.zinc[100],
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.emerald[100],
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.emerald[700],
  },
  messageContent: {
    flex: 1,
    marginRight: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.zinc[500],
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.zinc[600],
    lineHeight: 18,
  },
  lastMessageUnread: {
    fontWeight: '500',
    color: theme.colors.zinc[800],
  },
  threadMeta: {
    alignItems: 'center',
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: theme.colors.emerald[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.zinc[100],
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.zinc[600],
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.zinc[600],
    fontWeight: '500',
  },

  // Swipe-to-delete styles
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeableItem: {
    backgroundColor: 'white',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.rose[500],
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44, // Ensure minimum touch target size
    width: '100%',
  },
  deleteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});