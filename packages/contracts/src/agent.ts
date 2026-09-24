export interface PlanStep {
    stepNumber: number;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    tool?: string | null;
}

export interface Citation {
    id: string;
    chunkId: string;
    documentId: string;
    filename: string;
    startLine?: number | null;
    endLine?: number | null;
    headerPath: string[];
    preview: string;
}

export interface AgentStateData {
    sessionId: string;
    userId?: string | null;
    query: string;
    documentId?: string | null;
    nodeHistory: string[];
    currentNode?: string | null;
    plan: PlanStep[];
    citations: Citation[];
    reflectionScore: number;
    reflectionFeedback?: string | null;
    isGrounded: boolean;
    needsReplan: boolean;
    iterationCount: number;
    maxIterations: number;
    response: string;
    mermaidDiagrams: string[];
    isComplete: boolean;
    createdAt: string;
    completedAt?: string | null;
}

export interface AgentInvokeRequest {
    query: string;
    documentId?: string | null;
    sessionId?: string | null;
}

export interface AgentInvokeResponse {
    sessionId: string;
    query: string;
    response: string;
    nodeHistory: string[];
    plan: PlanStep[];
    citations: Citation[];
    mermaidDiagrams: string[];
    reflectionScore: number;
    isGrounded: boolean;
    iterationCount: number;
    isComplete: boolean;
    createdAt: string;
    completedAt?: string | null;
}
