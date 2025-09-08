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
  const flashListRef = useRef<FlashListRef<Message>>(null);

  // Fetch messages for this thread
  const messagesQuery = useQuery(api.queries.chat.getThreadMessages, {
    threadId: threadId as Id<"chatMessageThreads">,
    paginationOpts: { numItems: 100, cursor: null }
  });

  // Get thread info
  const threadQuery = useQuery(api.queries.chat.getThreadById, {
    threadId: threadId as Id<"chatMessageThreads">
  });

  // Mutations
  const sendMessageMutation = useMutation(api.mutations.chat.sendMessage);
  const markAsReadMutation = useMutation(api.mutations.chat.markMessagesAsRead);

  const messages = messagesQuery?.page || [];

  useEffect(() => {
    // Scroll to bottom when messages load or new message arrives
    if (messages.length > 0) {
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    // Mark messages as read when screen opens or when new messages arrive
    if (threadId && messages.length > 0) {
      markAsReadMutation({ threadId: threadId as Id<"chatMessageThreads"> })
        .catch(error => console.error('Failed to mark messages as read:', error));
    }
  }, [threadId, messages.length]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !threadQuery) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      await sendMessageMutation({
        venueId: threadQuery.venueId,
        content: messageContent,
        messageType: 'text'
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message text on error
      setNewMessage(messageContent);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isConsumer={item.senderType === 'consumer'}
    />
  ), []);

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
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          getItemType={(item) => {
            if (item.messageType === 'system') return 'system';
            if (item.messageType === 'cancellation_card') return 'cancellation';
            return item.senderType === 'consumer' ? 'consumer' : 'venue';
          }}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flashListRef.current?.scrollToEnd({ animated: true })}
          removeClippedSubviews={true}
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
});