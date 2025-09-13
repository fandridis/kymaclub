import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeftIcon, SendIcon, MapPinIcon, CalendarIcon } from 'lucide-react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { theme } from '../../theme';
import type { Doc, Id } from '@repo/api/convex/_generated/dataModel';
import { usePresence } from '../../hooks/usePresence';

// Type alias for better readability
type Message = Doc<"chatMessages">;

interface ConversationScreenParams {
  threadId: string;
  venueName: string;
  venueImage?: string;
}

type ConversationScreenRouteProp = RouteProp<{ Conversation: ConversationScreenParams }, 'Conversation'>;

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (diffInDays === 1) {
    return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (diffInDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
      date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function CancellationCard({ message }: { message: Message }) {
  if (!message.cancellationData) return null;

  const { className, instructorName, originalDateTime, cancellationReason, canRebook } = message.cancellationData;
  const originalDate = new Date(originalDateTime);

  return (
    <View style={styles.cancellationCard}>
      <View style={styles.cancellationHeader}>
        <CalendarIcon size={20} color={theme.colors.rose[600]} />
        <Text style={styles.cancellationTitle}>Class Cancelled</Text>
      </View>

      <View style={styles.cancellationContent}>
        <Text style={styles.cancellationClassName}>{className}</Text>
        <Text style={styles.cancellationDetails}>
          with {instructorName}
        </Text>
        <Text style={styles.cancellationDetails}>
          {originalDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })} at {originalDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </Text>
        {cancellationReason && (
          <Text style={styles.cancellationReason}>Reason: {cancellationReason}</Text>
        )}
      </View>

      {canRebook && (
        <View style={styles.cancellationActions}>
          <TouchableOpacity style={styles.rebookButton}>
            <Text style={styles.rebookButtonText}>Find Similar Class</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function SystemMessage({ message }: { message: Message }) {
  if (!message.systemContext) return null;

  const { metadata } = message.systemContext;
  const className = metadata?.className || 'Class';
  const startTime = metadata?.startTime || Date.now();
  const instructor = metadata?.instructor || 'Instructor';
  const classDate = new Date(startTime);

  return (
    <View style={styles.systemMessage}>
      <View style={styles.systemHeader}>
        <CalendarIcon size={16} color={theme.colors.emerald[600]} />
        <Text style={styles.systemTitle}>Booking Confirmed</Text>
      </View>

      <Text style={styles.systemClassName}>{className}</Text>
      <Text style={styles.systemDetails}>with {instructor}</Text>
      <Text style={styles.systemDetails}>
        {classDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })} at {classDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}
      </Text>
    </View>
  );
}

function MessageBubble({ message, isConsumer }: { message: Message; isConsumer: boolean }) {
  const formatTime = (timestamp: number) => formatMessageTime(timestamp);
  const [isMultiline, setIsMultiline] = useState(false);

  if (message.messageType === 'cancellation_card') {
    return (
      <View style={styles.messageContainer}>
        <View style={styles.systemCardContainer}>
          <CancellationCard message={message} />
          <Text style={styles.systemMessageTime}>{formatTime(message.createdAt)}</Text>
        </View>
      </View>
    );
  }

  if (message.messageType === 'system') {
    return (
      <View style={styles.messageContainer}>
        <View style={styles.systemCardContainer}>
          <SystemMessage message={message} />
          <Text style={styles.systemMessageTime}>{formatTime(message.createdAt)}</Text>
        </View>
      </View>
    );
  }

  const handleTextLayout = (event: any) => {
    const { lines } = event.nativeEvent;

    if (lines.length > 1) {
      setIsMultiline(true);
      return;
    }

    // For single line, check if there's enough space for timestamp inline
    const lastLine = lines[0];
    const timestampWidth = 60; // Approximate width needed for timestamp + margin
    const bubbleWidth = lastLine.width + 32; // Text width + bubble padding
    const maxBubbleWidth = 240; // Conservative max width to leave space for timestamp

    // Use bottom positioning if the bubble would be too wide
    setIsMultiline(bubbleWidth + timestampWidth > maxBubbleWidth);
  };

  return (
    <View style={[
      styles.messageContainer,
      isConsumer ? styles.consumerMessageContainer : styles.venueMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        isConsumer ? styles.consumerBubble : styles.venueBubble,
        !isMultiline && styles.messageBubbleSingleLine
      ]}>
        {!isConsumer && message.senderSnapshot && (
          <Text style={styles.senderName}>{message.senderSnapshot.name || 'Venue Staff'}</Text>
        )}

        {isMultiline ? (
          // Multi-line layout: text above, timestamp at bottom right
          <>
            <Text
              style={[
                styles.messageText,
                isConsumer ? styles.consumerMessageText : styles.venueMessageText
              ]}
              onTextLayout={handleTextLayout}
            >
              {message.content}
            </Text>
            <Text style={[
              styles.messageTimeInBubble,
              isConsumer ? styles.consumerMessageTimeInBubble : styles.venueMessageTimeInBubble
            ]}>
              {formatTime(message.createdAt)}
            </Text>
          </>
        ) : (
          // Single line layout: text and timestamp in same row
          <View style={styles.singleLineMessageContainer}>
            <Text
              style={[
                styles.messageText,
                styles.singleLineMessageText,
                isConsumer ? styles.consumerMessageText : styles.venueMessageText
              ]}
              onTextLayout={handleTextLayout}
            >
              {message.content}
            </Text>
            <Text style={[
              styles.messageTimeInline,
              isConsumer ? styles.consumerMessageTimeInBubble : styles.venueMessageTimeInBubble
            ]}>
              {formatTime(message.createdAt)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function ConversationScreen() {
  const navigation = useNavigation();
  const route = useRoute<ConversationScreenRouteProp>();
  const { threadId, venueName, venueImage } = route.params;

  const [newMessage, setNewMessage] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const flashListRef = useRef<FlashListRef<Message>>(null);
  const lastMessageCountRef = useRef(0);
  const userSentMessageRef = useRef(false);

  // Initialize presence tracking for smart notifications
  const presence = usePresence();

  // Fetch messages for this thread - start with last 50 messages
  const messagesQuery = useQuery(api.queries.chat.getThreadMessages, {
    threadId: threadId as Id<"chatMessageThreads">,
    paginationOpts: { numItems: 50, cursor: null }
  });

  // Get thread info
  const threadQuery = useQuery(api.queries.chat.getThreadById, {
    threadId: threadId as Id<"chatMessageThreads">
  });

  // Query for loading older messages
  const olderMessagesQuery = useQuery(
    api.queries.chat.getThreadMessages,
    loadingOlder && paginationCursor ? {
      threadId: threadId as Id<"chatMessageThreads">,
      paginationOpts: { numItems: 100, cursor: paginationCursor }
    } : "skip"
  );

  // Mutations
  const sendMessageMutation = useMutation(api.mutations.chat.sendMessage);
  const markAsReadMutation = useMutation(api.mutations.chat.markMessagesAsRead);

  // Handle initial message load
  useEffect(() => {
    if (messagesQuery?.page && isInitialLoad) {
      const newMessages = messagesQuery.page;
      setAllMessages(newMessages);
      setPaginationCursor(messagesQuery.continueCursor);
      setHasMoreMessages(!messagesQuery.isDone);
      lastMessageCountRef.current = newMessages.length;
      setIsInitialLoad(false);

      // Scroll to bottom on initial load with multiple attempts to ensure it works
      const scrollToBottom = () => {
        flashListRef.current?.scrollToEnd({ animated: false });
      };

      // Multiple timeouts to handle different loading scenarios
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 150);
      setTimeout(scrollToBottom, 300);
    }
  }, [messagesQuery?.page, isInitialLoad]);

  // Handle real-time message updates
  useEffect(() => {
    if (messagesQuery?.page && !isInitialLoad && !loadingOlder) {
      const newMessages = messagesQuery.page;
      const existingMessageIds = new Set(allMessages.map(m => m._id));
      const actuallyNewMessages = newMessages.filter(m => !existingMessageIds.has(m._id));

      if (actuallyNewMessages.length > 0) {
        setAllMessages(prev => [...prev, ...actuallyNewMessages]);

        // Only scroll if user is at bottom or they sent the message
        if (isAtBottom || userSentMessageRef.current) {
          setTimeout(() => {
            flashListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }

        // Reset user sent flag
        userSentMessageRef.current = false;
      }
    }
  }, [messagesQuery?.page, isInitialLoad, loadingOlder, allMessages, isAtBottom]);

  // Handle loading older messages
  useEffect(() => {
    if (olderMessagesQuery?.page) {
      const olderMessages = olderMessagesQuery.page;
      setAllMessages(prev => [...olderMessages, ...prev]);
      setPaginationCursor(olderMessagesQuery.continueCursor);
      setHasMoreMessages(!olderMessagesQuery.isDone);
      setLoadingOlder(false);
      // Note: We don't scroll here - FlashList should maintain position
    }
  }, [olderMessagesQuery?.page]);

  // Mark messages as read
  useEffect(() => {
    if (threadId && allMessages.length > 0) {
      markAsReadMutation({ threadId: threadId as Id<"chatMessageThreads"> })
        .catch(error => console.error('Failed to mark messages as read:', error));
    }
  }, [threadId, allMessages.length]);

  // Handle presence tracking when entering/leaving conversation
  useEffect(() => {
    if (threadId) {
      // Enter conversation - notify presence system
      presence.enterConversation(threadId as Id<"chatMessageThreads">);
      
      // Cleanup: leave conversation when component unmounts
      return () => {
        presence.leaveConversation();
      };
    }
  }, [threadId, presence]);

  const handleLoadOlderMessages = () => {
    if (loadingOlder || !hasMoreMessages || !paginationCursor) return;
    setLoadingOlder(true);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !threadQuery) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      // Flag that user sent a message (should always scroll)
      userSentMessageRef.current = true;

      await sendMessageMutation({
        venueId: threadQuery.venueId,
        content: messageContent,
        messageType: 'text'
      });

      // The scroll will happen in the useEffect when the new message arrives
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message text on error
      setNewMessage(messageContent);
      userSentMessageRef.current = false; // Reset flag on error
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    // Check if user is within 100px of the bottom
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    const newIsAtBottom = distanceFromBottom <= 100;

    // Only update if it actually changed to prevent unnecessary re-renders
    if (newIsAtBottom !== isAtBottom) {
      setIsAtBottom(newIsAtBottom);
    }
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isConsumer={item.senderType === 'consumer'}
    />
  ), []);

  const LoadOlderMessagesButton = () => {
    if (!hasMoreMessages) return null;

    return (
      <View style={styles.loadOlderContainer}>
        <TouchableOpacity
          style={styles.loadOlderButton}
          onPress={handleLoadOlderMessages}
          disabled={loadingOlder}
          activeOpacity={0.7}
        >
          {loadingOlder ? (
            <ActivityIndicator size="small" color={theme.colors.emerald[500]} />
          ) : (
            <Text style={styles.loadOlderText}>Load older messages</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (messagesQuery === undefined || threadQuery === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeftIcon size={24} color={theme.colors.zinc[700]} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{venueName}</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.emerald[500]} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeftIcon size={24} color={theme.colors.zinc[700]} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            {venueImage && (
              <Image source={{ uri: venueImage }} style={styles.headerAvatar} />
            )}
            <View style={styles.headerText}>
              <Text style={styles.headerTitle} numberOfLines={1}>{venueName}</Text>
              <Text style={styles.headerSubtitle}>Usually replies within an hour</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlashList
          ref={flashListRef}
          data={allMessages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          getItemType={(item) => {
            if (item.messageType === 'system') return 'system';
            if (item.messageType === 'cancellation_card') return 'cancellation';
            return item.senderType === 'consumer' ? 'consumer' : 'venue';
          }}
          ListHeaderComponent={LoadOlderMessagesButton}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: 20,
          }}
          onLayout={() => {
            // Additional scroll to bottom when FlashList layout is complete
            if (isInitialLoad === false && allMessages.length > 0) {
              setTimeout(() => {
                flashListRef.current?.scrollToEnd({ animated: false });
              }, 50);
            }
          }}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.zinc[500]}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <SendIcon
              size={20}
              color={newMessage.trim() ? 'white' : theme.colors.zinc[400]}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.zinc[200],
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: theme.colors.zinc[100],
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.zinc[500],
  },

  // Messages
  messagesContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  messageContainer: {
    marginVertical: 2,
  },
  consumerMessageContainer: {
    alignItems: 'flex-end',
  },
  venueMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    minWidth: 60,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    borderRadius: 18,
  },
  consumerBubble: {
    backgroundColor: theme.colors.emerald[500],
    borderBottomRightRadius: 4,
  },
  venueBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.zinc[600],
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  consumerMessageText: {
    color: 'white',
  },
  venueMessageText: {
    color: theme.colors.zinc[900],
  },
  messageTime: {
    fontSize: 11,
    color: theme.colors.zinc[500],
    marginTop: 4,
    paddingHorizontal: 4,
  },
  consumerMessageTime: {
    textAlign: 'right',
  },
  venueMessageTime: {
    textAlign: 'left',
  },

  // In-bubble timestamp styles
  messageTimeInBubble: {
    fontSize: 11,
    position: 'absolute',
    bottom: 6,
    right: 8,
  },
  consumerMessageTimeInBubble: {
    color: theme.colors.zinc[50],
  },
  venueMessageTimeInBubble: {
    color: theme.colors.zinc[400],
  },

  // Single line message layout
  messageBubbleSingleLine: {
    paddingBottom: 8, // Reset padding for single line
  },
  singleLineMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  singleLineMessageText: {
    flex: 0, // Don't grow, let timestamp take remaining space
  },
  messageTimeInline: {
    fontSize: 11,
    marginLeft: 10,
    marginBottom: -3
  },
  systemCardContainer: {
    position: 'relative',
  },
  systemMessageTime: {
    fontSize: 11,
    color: theme.colors.emerald[600],
    position: 'absolute',
    bottom: 8,
    right: 12,
  },

  // System messages
  systemMessage: {
    backgroundColor: theme.colors.emerald[50],
    borderWidth: 1,
    borderColor: theme.colors.emerald[200],
    borderRadius: 12,
    padding: 16,
    alignSelf: 'center',
    maxWidth: '85%',
  },
  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  systemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.emerald[700],
  },
  systemClassName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.zinc[900],
    marginBottom: 4,
  },
  systemDetails: {
    fontSize: 14,
    color: theme.colors.zinc[600],
    marginBottom: 2,
  },

  // Cancellation cards
  cancellationCard: {
    backgroundColor: theme.colors.rose[50],
    borderWidth: 1,
    borderColor: theme.colors.rose[200],
    borderRadius: 12,
    padding: 16,
    alignSelf: 'center',
    maxWidth: '85%',
  },
  cancellationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cancellationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.rose[700],
  },
  cancellationContent: {
    marginBottom: 16,
  },
  cancellationClassName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.zinc[900],
    marginBottom: 4,
  },
  cancellationDetails: {
    fontSize: 14,
    color: theme.colors.zinc[600],
    marginBottom: 2,
  },
  cancellationReason: {
    fontSize: 13,
    color: theme.colors.zinc[500],
    fontStyle: 'italic',
    marginTop: 8,
  },
  cancellationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rebookButton: {
    backgroundColor: theme.colors.emerald[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rebookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.zinc[200],
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.zinc[300],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: theme.colors.zinc[900],
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: theme.colors.emerald[500],
  },
  sendButtonInactive: {
    backgroundColor: theme.colors.zinc[200],
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

  // Load older messages button
  loadOlderContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  loadOlderButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.emerald[200],
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  loadOlderText: {
    fontSize: 14,
    color: theme.colors.emerald[600],
    fontWeight: '600',
  },
});