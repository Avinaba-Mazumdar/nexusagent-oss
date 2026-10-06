'use client';

import * as React from 'react';
import { MessageSquare, Search, Plus, Trash2, X, Clock, Loader2 } from 'lucide-react';
import type { ChatConversation, ChatHistoryResponse, ChatConversationDetailResponse, ChatMessageRecord } from '@nexusagent/contracts';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

export interface ChatHistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeSessionId?: string | null;
    onSelectConversation: (conversationId: string, title: string, messages?: ChatMessageRecord[], isLoading?: boolean) => void;
    onNewChat: () => void;
    isGoogleUser: boolean;
    userId?: string | null;
}

// Module-level in-memory cache to guarantee 0ms instant loading between view switches
const memoryMessageCache = new Map<string, ChatMessageRecord[]>();

function formatRelativeTime(dateString: string): string {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

function getGroupLabel(dateString: string): 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older' {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const itemTime = date.getTime();

        if (itemTime >= todayStart) return 'Today';
        if (itemTime >= todayStart - 86400000) return 'Yesterday';
        if (itemTime >= todayStart - 7 * 86400000) return 'Previous 7 Days';
        return 'Older';
    } catch {
        return 'Older';
    }
}

function ChatHistorySidebarBase({
    isOpen,
    onClose,
    activeSessionId,
    onSelectConversation,
    onNewChat,
    isGoogleUser,
    userId
}: ChatHistorySidebarProps) {
    const storageKey = React.useMemo(() => `nexusagent_chat_history_${userId || 'anonymous'}`, [userId]);

    const [searchQuery, setSearchQuery] = React.useState('');
    const [conversations, setConversations] = React.useState<ChatConversation[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const cached = localStorage.getItem(`nexusagent_chat_history_${userId || 'anonymous'}`);
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const searchInputRef = React.useRef<HTMLInputElement | null>(null);
    const inFlightRef = React.useRef(false);
    const lastFetchRef = React.useRef<number>(0);

    // Prefetch messages for a given conversation in the background
    const prefetchMessages = React.useCallback((convId: string) => {
        if (memoryMessageCache.has(convId)) return;
        try {
            const cached = localStorage.getItem(`nexusagent_msgs_${convId}`);
            if (cached) {
                memoryMessageCache.set(convId, JSON.parse(cached));
                return;
            }
        } catch {
            // Ignore
        }

        apiClient<ChatConversationDetailResponse>(`/api/chat/history/${convId}`)
            .then((detail) => {
                if (detail?.messages) {
                    memoryMessageCache.set(convId, detail.messages);
                    try {
                        localStorage.setItem(`nexusagent_msgs_${convId}`, JSON.stringify(detail.messages));
                    } catch {
                        // Ignore
                    }
                }
            })
            .catch(() => {
                // Silently ignore prefetch errors
            });
    }, []);

    // Fetch conversations from server with local cache fallback and deduplication
    const loadConversations = React.useCallback(
        async (force = false) => {
            if (!isGoogleUser || inFlightRef.current) return;
            const now = Date.now();
            if (!force && now - lastFetchRef.current < 8000) return;

            inFlightRef.current = true;
            try {
                const cached = localStorage.getItem(storageKey);
                if (cached) {
                    setConversations((prev) => (prev.length === 0 ? JSON.parse(cached) : prev));
                }
            } catch {
                // Ignore
            }

            try {
                const data = await apiClient<ChatHistoryResponse>('/api/chat/history');
                if (data?.conversations) {
                    lastFetchRef.current = Date.now();
                    setConversations(data.conversations);
                    try {
                        localStorage.setItem(storageKey, JSON.stringify(data.conversations));
                    } catch {
                        // Ignore quota
                    }

                    // Background prefetch top 5 conversations so clicking them is instantaneous
                    data.conversations.slice(0, 5).forEach((conv) => {
                        prefetchMessages(conv.id);
                    });
                }
            } catch {
                // Fallback to local cache already loaded
            } finally {
                inFlightRef.current = false;
                setIsLoading(false);
            }
        },
        [isGoogleUser, storageKey, prefetchMessages]
    );

    React.useEffect(() => {
        if (isOpen && isGoogleUser) {
            loadConversations();
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 30);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isGoogleUser, loadConversations]);

    // Handle Escape key
    React.useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // 0ms instant optimistic delete
    const handleDelete = React.useCallback(
        (e: React.MouseEvent, convId: string) => {
            e.stopPropagation();

            memoryMessageCache.delete(convId);

            // 1. Instantly update list state
            setConversations((prev) => {
                const updated = prev.filter((c) => c.id !== convId);
                try {
                    localStorage.setItem(storageKey, JSON.stringify(updated));
                    localStorage.removeItem(`nexusagent_msgs_${convId}`);
                } catch {
                    // Ignore
                }
                return updated;
            });

            // 2. If deleting currently active conversation, reset canvas immediately
            if (activeSessionId === convId) {
                onNewChat();
            }

            // 3. Delete on server in background
            apiClient(`/api/chat/history/${convId}`, { method: 'DELETE' }).catch(() => {
                // Background fail
            });
        },
        [storageKey, activeSessionId, onNewChat]
    );

    // 0ms instant optimistic select
    const handleSelect = React.useCallback(
        (conv: ChatConversation) => {
            // 1. Immediately close drawer
            onClose();

            // 2. Check memory cache first, then localStorage
            let initialMessages: ChatMessageRecord[] | undefined = memoryMessageCache.get(conv.id);
            if (!initialMessages) {
                try {
                    const cached = localStorage.getItem(`nexusagent_msgs_${conv.id}`);
                    if (cached) {
                        initialMessages = JSON.parse(cached);
                        if (initialMessages) memoryMessageCache.set(conv.id, initialMessages);
                    }
                } catch {
                    // Ignore
                }
            }

            const hasCached = Boolean(initialMessages && initialMessages.length > 0);

            // 3. Immediately render canvas (or clear canvas with loading flag if uncached)
            onSelectConversation(conv.id, conv.title, initialMessages, !hasCached);

            // 4. Background revalidate from server
            apiClient<ChatConversationDetailResponse>(`/api/chat/history/${conv.id}`)
                .then((detail) => {
                    if (detail?.messages) {
                        memoryMessageCache.set(conv.id, detail.messages);
                        try {
                            localStorage.setItem(`nexusagent_msgs_${conv.id}`, JSON.stringify(detail.messages));
                        } catch {
                            // Ignore
                        }
                        onSelectConversation(conv.id, conv.title, detail.messages, false);
                    }
                })
                .catch(() => {
                    // Keep existing messages
                });
        },
        [onClose, onSelectConversation]
    );

    // Filtered conversations
    const filteredConversations = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return conversations;
        return conversations.filter(
            (c) => c.title.toLowerCase().includes(query) || (c.lastSnippet && c.lastSnippet.toLowerCase().includes(query))
        );
    }, [conversations, searchQuery]);

    // Grouping
    const groupedConversations = React.useMemo(() => {
        const groups: Record<string, ChatConversation[]> = {
            Today: [],
            Yesterday: [],
            'Previous 7 Days': [],
            Older: []
        };

        for (const conv of filteredConversations) {
            const group = getGroupLabel(conv.createdAt);
            groups[group].push(conv);
        }

        return groups;
    }, [filteredConversations]);

    if (!isGoogleUser) {
        return null;
    }

    return (
        <>
            {/* Backdrop Overlay */}
            {isOpen && (
                <div
                    role="presentation"
                    aria-hidden="true"
                    onClick={onClose}
                    className="absolute inset-0 bg-background/50 backdrop-blur-xs z-30 transition-opacity animate-in fade-in duration-150"
                />
            )}

            {/* Slide-over Drawer Panel */}
            <aside
                aria-label="Chat History and Search"
                aria-hidden={!isOpen}
                className={`absolute inset-y-0 left-0 z-40 w-80 max-w-[85vw] bg-card/95 backdrop-blur-md border-r border-border shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
                }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-card/50">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-foreground">Chat History</h2>
                            <p className="text-[10px] text-muted-foreground">Google Cloud Sync</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => {
                                onNewChat();
                                onClose();
                            }}
                            title="Start New Chat"
                            aria-label="New Chat"
                            className="h-8 w-8 text-foreground hover:bg-secondary rounded-lg"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={onClose}
                            title="Close History Panel"
                            aria-label="Close History"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-border bg-card/30 shrink-0">
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search synthesis queries..."
                            aria-label="Search conversation history"
                            className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-primary focus:bg-card transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                aria-label="Clear search query"
                                className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content / Conversation List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {isLoading && conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-xs gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span>Loading history...</span>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground text-xs space-y-2">
                            <MessageSquare className="h-8 w-8 opacity-25" />
                            <p className="font-semibold text-foreground">{searchQuery ? 'No matching conversations' : 'No history yet'}</p>
                            <p className="text-[11px] leading-relaxed">
                                {searchQuery ? 'Try adjusting your search keywords.' : 'Send a prompt on the Synthesis Canvas to start saving conversations.'}
                            </p>
                        </div>
                    ) : (
                        (['Today', 'Yesterday', 'Previous 7 Days', 'Older'] as const).map((groupKey) => {
                            const items = groupedConversations[groupKey];
                            if (!items || items.length === 0) return null;

                            return (
                                <div key={groupKey} className="space-y-1">
                                    <h3 className="px-2 text-[10px] font-bold text-muted-foreground tracking-wider uppercase">{groupKey}</h3>
                                    <div className="space-y-0.5">
                                        {items.map((conv) => {
                                            const isActive = activeSessionId === conv.id;
                                            return (
                                                <div
                                                    key={conv.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onMouseEnter={() => prefetchMessages(conv.id)}
                                                    onFocus={() => prefetchMessages(conv.id)}
                                                    onClick={() => handleSelect(conv)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            handleSelect(conv);
                                                        }
                                                    }}
                                                    className={`group w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                                                        isActive
                                                            ? 'bg-primary/10 border border-primary/30 text-foreground font-medium'
                                                            : 'hover:bg-secondary/70 text-card-foreground border border-transparent'
                                                    }`}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs text-foreground group-hover:text-primary transition-colors">
                                                            {conv.title}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                                            <Clock className="h-3 w-3 shrink-0" />
                                                            <span>{formatRelativeTime(conv.createdAt)}</span>
                                                            {conv.messageCount && conv.messageCount > 0 ? (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{conv.messageCount} msgs</span>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDelete(e, conv.id)}
                                                        aria-label={`Delete conversation ${conv.title}`}
                                                        title="Delete conversation"
                                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all shrink-0 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer status */}
                <div className="p-2.5 border-t border-border bg-card/60 text-[10px] text-muted-foreground flex items-center justify-between shrink-0">
                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Google Auth Sync Active
                    </span>
                    <span>{conversations.length} saved</span>
                </div>
            </aside>
        </>
    );
}

export const ChatHistorySidebar = React.memo(ChatHistorySidebarBase);
