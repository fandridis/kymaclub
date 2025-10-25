import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, User, MapPin, Calendar, Clock } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@repo/api/convex/_generated/api'
import type { Doc, Id } from '@repo/api/convex/_generated/dataModel'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'

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
                    <div className="text-sm">{message.content}</div>
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${isFromVenue ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.createdAt)}
                </div>
            </div>
        </div>
    )
}

export function ConversationPage() {
    const navigate = useNavigate()
    const params = useParams({ from: '/_app-layout/messages/conversation/$threadId' })
    const search = useSearch({ from: '/_app-layout/messages/conversation/$threadId' })
    const { threadId } = params
    const { userName = 'Unknown User', venueName = 'Unknown Venue' } = search

    const [newMessage, setNewMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Fetch messages for this thread
    const messagesQuery = useQuery(api.queries.chat.getThreadMessages, {
        threadId: threadId as Id<"chatMessageThreads">,
        paginationOpts: { numItems: 100, cursor: null }
    })

    // Get thread info
    const threadQuery = useQuery(api.queries.chat.getThreadById, {
        threadId: threadId as Id<"chatMessageThreads">
    })

    // Mutations
    const sendReplyMutation = useMutation(api.mutations.chat.sendReply)
    const markAsReadMutation = useMutation(api.mutations.chat.markMessagesAsRead)

    const messages = messagesQuery?.page || []

    // Scroll to bottom when messages load, change, or when threadId changes (switching chats)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, threadId])

    // Mark messages as read when the page loads or threadId changes
    useEffect(() => {
        if (threadId) {
            markAsReadMutation({
                threadId: threadId as Id<"chatMessageThreads">
            }).catch(error => console.error('Failed to mark messages as read:', error))
        }
    }, [threadId, markAsReadMutation])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !threadQuery) return

        const messageContent = newMessage.trim()
        setNewMessage('') // Clear input immediately for better UX

        try {
            await sendReplyMutation({
                threadId: threadId as Id<"chatMessageThreads">,
                content: messageContent,
                messageType: 'text'
            })
        } catch (error) {
            console.error('Failed to send message:', error)
            // Restore message text on error
            setNewMessage(messageContent)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    // Loading state
    if (messagesQuery === undefined || threadQuery === undefined) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Loading conversation...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate({ to: '/messages' } as any)}
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">{userName}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{venueName}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <Card className="h-[600px] flex flex-col">
                <CardHeader className="flex-shrink-0 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {messages.length} messages
                            </span>
                        </div>
                        <Badge variant="outline">Active</Badge>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-2">
                        {messages.length > 0 ? (
                            messages.map((message) => (
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
                    <div className="border-t p-4">
                        <div className="flex gap-3">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1"
                                maxLength={500}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                size="icon"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            Press Enter to send • Shift+Enter for new line
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}