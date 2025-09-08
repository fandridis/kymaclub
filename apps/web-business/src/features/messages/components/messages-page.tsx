import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Search, Clock, User } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '@repo/api/convex/_generated/api'
import type { Doc } from '@repo/api/convex/_generated/dataModel'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ConversationView } from './conversation-view'

function formatMessageTime(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInMinutes < 1) {
        return 'Just now'
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} min ago`
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`
    } else if (diffInDays === 1) {
        return 'Yesterday'
    } else if (diffInDays < 7) {
        return `${diffInDays} days ago`
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
}

interface MessageThreadRowProps {
    thread: Doc<"chatMessageThreads">
    onThreadClick: (thread: Doc<"chatMessageThreads">) => void
    isSelected: boolean
}

function MessageThreadRow({ thread, onThreadClick, isSelected }: MessageThreadRowProps) {
    const unreadCount = thread.unreadCountVenue || 0
    const userName = thread.userSnapshot?.name || thread.userSnapshot?.email || 'Unknown User'
    const lastMessage = thread.lastMessagePreview || 'No messages yet'
    const timestamp = formatMessageTime(thread.lastMessageAt)
    const venueName = thread.venueSnapshot?.name || 'Unknown Venue'

    return (
        <div 
            className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
                isSelected ? 'bg-muted border-r-2 border-r-primary' : ''
            }`}
            onClick={() => onThreadClick(thread)}
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-medium text-foreground truncate">{userName}</div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">{timestamp}</span>
                            {unreadCount > 0 && (
                                <Badge className="bg-primary text-primary-foreground text-xs h-5 px-2">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground truncate mb-1">{venueName}</div>
                    <div className={`text-sm truncate ${unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {lastMessage}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function MessagesPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
    const [isMobileConversationView, setIsMobileConversationView] = useState(false)
    const navigate = useNavigate()
    const search = useSearch({ from: '/_app-layout/messages' })

    // Use threadId from URL if present
    const currentThreadId = (search as any)?.threadId || selectedThreadId

    // Fetch message threads for the business
    const messageThreads = useQuery(api.queries.chat.getBusinessMessageThreads, {
        paginationOpts: { numItems: 50, cursor: null }
    })

    // Get total unread count for the business
    const unreadCountQuery = useQuery(api.queries.chat.getBusinessUnreadMessageCount, {})
    const totalUnreadCount = unreadCountQuery || 0

    const handleThreadClick = (thread: Doc<"chatMessageThreads">) => {
        setSelectedThreadId(thread._id)
        setIsMobileConversationView(true) // Show conversation on mobile
        // Update URL with thread selection
        navigate({
            to: '/messages',
            search: { 
                threadId: thread._id,
                userName: thread.userSnapshot?.name || thread.userSnapshot?.email || 'Unknown User',
                venueName: thread.venueSnapshot?.name || 'Unknown Venue'
            }
        })
    }

    const handleBackToList = () => {
        setIsMobileConversationView(false)
        setSelectedThreadId(null)
        navigate({
            to: '/messages',
            search: {}
        })
    }

    // Loading state
    if (messageThreads === undefined) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Loading messages...</div>
            </div>
        )
    }

    const threads = messageThreads.page || []

    // Filter threads based on search term
    const filteredThreads = threads.filter(thread => {
        if (!searchTerm) return true
        const userName = thread.userSnapshot?.name || thread.userSnapshot?.email || ''
        const venueName = thread.venueSnapshot?.name || ''
        const lastMessage = thread.lastMessagePreview || ''
        const searchLower = searchTerm.toLowerCase()
        
        return userName.toLowerCase().includes(searchLower) ||
               venueName.toLowerCase().includes(searchLower) ||
               lastMessage.toLowerCase().includes(searchLower)
    })

    // Find selected thread data
    const selectedThread = currentThreadId ? threads.find(t => t._id === currentThreadId) : null

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 flex overflow-hidden">
            {/* Left Column - Conversations List */}
            <div className={`${
                isMobileConversationView ? 'hidden' : 'flex'
            } md:flex w-full md:w-96 border-r border-border flex-col`}>
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Messages</h1>
                            <p className="text-sm text-muted-foreground">
                                Customer conversations
                            </p>
                        </div>
                        {totalUnreadCount > 0 && (
                            <Badge variant="secondary" className="text-sm px-2 py-1">
                                {totalUnreadCount}
                            </Badge>
                        )}
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-9"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredThreads.length > 0 ? (
                        filteredThreads.map((thread) => (
                            <MessageThreadRow
                                key={thread._id}
                                thread={thread}
                                onThreadClick={handleThreadClick}
                                isSelected={thread._id === currentThreadId}
                            />
                        ))
                    ) : threads.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
                            <p className="text-muted-foreground text-sm">
                                Customer conversations will appear here when they message your venues
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-8 px-4">
                            <p className="text-muted-foreground">
                                No conversations match your search
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setSearchTerm('')}
                                className="mt-2"
                                size="sm"
                            >
                                Clear search
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column - Conversation View */}
            <div className={`${
                isMobileConversationView ? 'flex' : 'hidden md:flex'
            } flex-1 flex-col`}>
                {currentThreadId && selectedThread ? (
                    <ConversationView 
                        threadId={currentThreadId}
                        userName={(search as any)?.userName || selectedThread.userSnapshot?.name || 'Unknown User'}
                        venueName={(search as any)?.venueName || selectedThread.venueSnapshot?.name || 'Unknown Venue'}
                        onBack={handleBackToList}
                        showBackButton={true}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-foreground mb-2">Select a conversation</h3>
                            <p className="text-muted-foreground">
                                Choose a conversation from the left to start messaging
                            </p>
                        </div>
                    </div>
                )}
            </div>
            </div>
        </div>
    )
}