export interface ChatConversation {
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt?: string;
    messageCount?: number;
    lastSnippet?: string;
}

export interface ChatMessageRecord {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    planTrace?: unknown;
    reflectionSummary?: unknown;
    createdAt: string;
}

export interface ChatHistoryResponse {
    conversations: ChatConversation[];
    total: number;
}

export interface ChatConversationDetailResponse {
    conversation: ChatConversation;
    messages: ChatMessageRecord[];
}
