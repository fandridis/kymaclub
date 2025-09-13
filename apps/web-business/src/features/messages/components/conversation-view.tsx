import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, User, MapPin, Calendar, ArrowLeft, ChevronUp } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@repo/api/convex/_generated/api'
import type { Doc, Id } from '@repo/api/convex/_generated/dataModel'

// Type alias for better readability
type Message = Doc<"chatMessages">

function formatMessageTime(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (diffInDays === 1) {
        return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (diffInDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
            date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
}

function CancellationCard({ message }: { message: Message }) {
    if (!message.cancellationData) return null

    const { className, instructorName, originalDateTime, cancellationReason, canRebook } = message.cancellationData
    const originalDate = new Date(originalDateTime)

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto my-2">
            <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">Class Cancelled</span>
            </div>

            <div className="space-y-2">
                <div className="font-medium text-gray-900">{className}</div>
                <div className="text-sm text-gray-600">with {instructorName}</div>
                <div className="text-sm text-gray-600">
                    {originalDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                    })} at {originalDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    })}
                </div>
                {cancellationReason && (
                    <div className="text-sm text-gray-500 italic">Reason: {cancellationReason}</div>
                )}
            </div>

            {canRebook && (
                <div className="mt-3">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        Find Similar Class
                    </Button>
                </div>
            )}
        </div>
    )
}

function SystemMessage({ message }: { message: Message }) {
    if (!message.systemContext) return null

    const { metadata } = message.systemContext
    const className = metadata?.className || 'Class'
    const startTime = metadata?.startTime || Date.now()
    const instructor = metadata?.instructor || 'Instructor'
    const classDate = new Date(startTime)

    return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 max-w-md mx-auto my-2">
            <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Booking Confirmed</span>
            </div>

            <div className="space-y-1">
                <div className="font-medium text-gray-900">{className}</div>
                <div className="text-sm text-gray-600">with {instructor}</div>
                <div className="text-sm text-gray-600">
                    {classDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                    })} at {classDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    })}
                </div>
            </div>
        </div>
    )
}

function MessageBubble({ message, isFromVenue }: { message: Message; isFromVenue: boolean }) {
    const formatTime = (timestamp: number) => formatMessageTime(timestamp)

    if (message.messageType === 'cancellation_card') {
        return (
            <div className="flex flex-col items-center mb-4">
                <CancellationCard message={message} />
                <div className="text-xs text-gray-500 mt-1">{formatTime(message.createdAt)}</div>
            </div>
        )
    }

    if (message.messageType === 'system') {
        return (
            <div className="flex flex-col items-center mb-4">
                <SystemMessage message={message} />
                <div className="text-xs text-gray-500 mt-1">{formatTime(message.createdAt)}</div>
            </div>
        )
    }

    return (
        <div className={`flex mb-4 ${isFromVenue ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-xs lg:max-w-md">
                <div className={`rounded-lg px-4 py-2 ${isFromVenue
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-900 border border-gray-200'
                    }`}>
                    {!isFromVenue && message.senderSnapshot && (
                        <div className="text-xs font-medium text-gray-600 mb-1">
                            {message.senderSnapshot.name || 'Customer'}
                        </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${isFromVenue ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.createdAt)}
                </div>
            </div>
        </div>
    )
}

interface ConversationViewProps {
    threadId: string
    userName: string
    venueName: string
    onBack?: () => void
    showBackButton?: boolean
}

export function ConversationView({ threadId, userName, venueName, onBack, showBackButton = false }: ConversationViewProps) {
    const [newMessage, setNewMessage] = useState('')
    const [loadingOlder, setLoadingOlder] = useState(false)
    const [allMessages, setAllMessages] = useState<Message[]>([])
    const [paginationCursor, setPaginationCursor] = useState<string | null>(null)
    const [hasMoreMessages, setHasMoreMessages] = useState(true)
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Fetch messages for this thread - start with last 50 messages
    const messagesQuery = useQuery(api.queries.chat.getThreadMessages, {
        threadId: threadId as Id<"chatMessageThreads">,
        paginationOpts: { numItems: 50, cursor: null }
    })

    // Query for loading older messages
    const olderMessagesQuery = useQuery(
        api.queries.chat.getThreadMessages,
        loadingOlder && paginationCursor ? {
            threadId: threadId as Id<"chatMessageThreads">,
            paginationOpts: { numItems: 50, cursor: paginationCursor }
        } : "skip"
    )

    // Get thread info
    const threadQuery = useQuery(api.queries.chat.getThreadById, {
        threadId: threadId as Id<"chatMessageThreads">
    })

    // Mutations
    const sendReplyMutation = useMutation(api.mutations.chat.sendReply)
    const markAsReadMutation = useMutation(api.mutations.chat.markMessagesAsRead)

    // Reset state when threadId changes (switching between chats)
    useEffect(() => {
        setAllMessages([])
        setPaginationCursor(null)
        setHasMoreMessages(true)
        setIsInitialLoad(true)
        setLoadingOlder(false)
    }, [threadId])

    // Handle initial message load
    useEffect(() => {
        if (messagesQuery?.page && isInitialLoad) {
            // Backend returns newest first, reverse for chat display (oldest first)
            const newMessages = [...messagesQuery.page].reverse()
            setAllMessages(newMessages)
            setPaginationCursor(messagesQuery.continueCursor)
            setHasMoreMessages(!messagesQuery.isDone)
            setIsInitialLoad(false)

            // Scroll to bottom on initial load (including when switching chats)
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        }
    }, [messagesQuery?.page, isInitialLoad])

    // Handle real-time message updates
    useEffect(() => {
        if (messagesQuery?.page && !isInitialLoad && !loadingOlder) {
            // Backend returns newest first, but we need to check for new messages
            const newMessages = messagesQuery.page
            const existingMessageIds = new Set(allMessages.map(m => m._id))
            const actuallyNewMessages = newMessages.filter(m => !existingMessageIds.has(m._id))

            if (actuallyNewMessages.length > 0) {
                // New messages should be appended to the end (newest messages)
                setAllMessages(prev => [...prev, ...actuallyNewMessages])

                // Scroll to bottom for new messages
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
            }
        }
    }, [messagesQuery?.page, isInitialLoad, loadingOlder, allMessages])

    // Handle loading older messages with scroll position preservation
    useEffect(() => {
        if (olderMessagesQuery?.page && messagesContainerRef.current) {
            const container = messagesContainerRef.current
            const scrollTop = container.scrollTop
            const scrollHeight = container.scrollHeight

            // Backend returns newest first, reverse for chat display (oldest first)
            const olderMessages = [...olderMessagesQuery.page].reverse()
            setAllMessages(prev => [...olderMessages, ...prev])
            setPaginationCursor(olderMessagesQuery.continueCursor)
            setHasMoreMessages(!olderMessagesQuery.isDone)
            setLoadingOlder(false)

            // Preserve scroll position after DOM updates
            requestAnimationFrame(() => {
                const newScrollHeight = container.scrollHeight
                const heightDifference = newScrollHeight - scrollHeight
                container.scrollTop = scrollTop + heightDifference
            })
        }
    }, [olderMessagesQuery?.page])

    // Mark messages as read when the thread loads or when new messages arrive
    useEffect(() => {
        if (threadId && allMessages.length > 0) {
            markAsReadMutation({
                threadId: threadId as Id<"chatMessageThreads">
            }).catch(error => console.error('Failed to mark messages as read:', error))
        }
    }, [threadId, allMessages.length, markAsReadMutation])

    const handleLoadOlderMessages = useCallback(() => {
        if (loadingOlder || !hasMoreMessages || !paginationCursor) return
        setLoadingOlder(true)
    }, [loadingOlder, hasMoreMessages, paginationCursor])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !threadQuery) return

        const messageContent = newMessage.trim()
        setNewMessage('') // Clear input immediately for better UX

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }

        try {
            await sendReplyMutation({
                threadId: threadId as Id<"chatMessageThreads">,
                content: messageContent,
                messageType: 'text'
            })

            // Scroll to bottom after sending (will happen when new message arrives)
        } catch (error) {
            console.error('Failed to send message:', error)
            // Restore message text on error
            setNewMessage(messageContent)
        }
    }

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value)

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px'
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    // Loading state
    if (messagesQuery === undefined || threadQuery === undefined) {
        return (
            <div className="flex items-center justify-center flex-1">
                <div className="text-muted-foreground">Loading conversation...</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    {showBackButton && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="md:hidden flex-shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    )}
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-foreground truncate">{userName}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{venueName}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Load Older Messages Button */}
                {hasMoreMessages && (
                    <div className="text-center py-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLoadOlderMessages}
                            disabled={loadingOlder}
                            className="text-xs"
                        >
                            {loadingOlder ? (
                                <>Loading...</>
                            ) : (
                                <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    Load older messages
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {allMessages.length > 0 ? (
                    allMessages.map((message) => (
                        <MessageBubble
                            key={message._id}
                            message={message}
                            isFromVenue={message.senderType === 'venue'}
                        />
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        No messages yet. Start the conversation!
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-4">
                <div className="flex gap-3 items-end">
                    <Textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="flex-1 min-h-9 max-h-32 resize-none"
                        maxLength={500}
                        rows={1}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        size="icon"
                        className="flex-shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                    Press Enter to send • Shift+Enter for new line
                </div>
            </div>
        </div>
    )
}