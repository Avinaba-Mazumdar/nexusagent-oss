import type { CitationItem } from './document';

export type AgentRole = 'user' | 'assistant' | 'system';

export type AgentNodeName = 'planner' | 'retriever' | 'mcp_tools' | 'python_sandbox' | 'reflection' | 'synthesizer';

export type NodeExecutionStatus = 'idle' | 'running' | 'completed' | 'failed' | 'waiting_approval';

export type PlanStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface PlanStep {
    id: string;
    title: string;
    description: string;
    status: PlanStepStatus;
    assignedNode: AgentNodeName;
    resultSummary?: string;
}

export interface StepNode {
    id: string;
    name: AgentNodeName | string;
    label: string;
    status: NodeExecutionStatus;
    startTime?: number;
    endTime?: number;
    durationMs?: number;
    inputPayload?: Record<string, unknown>;
    outputPayload?: Record<string, unknown>;
    errorMessage?: string;
}

export interface InvariantCheckItem {
    name: string;
    passed: boolean;
    note?: string;
}

export interface ReflectionSummary {
    confidenceScore: number; // 0.0 to 1.0
    isPassing: boolean;
    invariantsChecked: InvariantCheckItem[];
    critiqueNotes: string;
    requiresReplan: boolean;
}

export interface TokenUsageMetrics {
    promptTokens: number;
    completionTokens: number;
    cachedTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
}

export type HitlImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface HitlRequestPayload {
    executionId: string;
    toolName: string;
    mcpServer: string;
    actionDescription: string;
    inputArgs: Record<string, unknown>;
    impactLevel: HitlImpactLevel;
    timestamp: string;
}

export interface HitlApprovalPayload {
    executionId: string;
    approved: boolean;
    feedback?: string;
    modifiedArgs?: Record<string, unknown>;
}

export interface AgentMessage {
    id: string;
    conversationId: string;
    role: AgentRole;
    content: string;
    citations?: CitationItem[];
    planTrace?: PlanStep[];
    reflectionSummary?: ReflectionSummary;
    createdAt: string;
}

export interface AgentState {
    sessionId: string;
    userId: string;
    conversationId: string;
    activeDocumentIds: string[];
    currentNode: AgentNodeName | null;
    plan: PlanStep[];
    stepNodes: StepNode[];
    messages: AgentMessage[];
    citations: CitationItem[];
    reflectionScore: number;
    tokens: TokenUsageMetrics;
    requiresHitl: boolean;
    pendingHitlRequest?: HitlRequestPayload | null;
    isStreaming: boolean;
    useSimulation: boolean;
}

export type SSEEventType = 'plan' | 'node_start' | 'tool_call' | 'tool_result' | 'reflection' | 'token' | 'hitl_request' | 'done' | 'error';

export interface SSEPlanPayload {
    goal: string;
    steps: PlanStep[];
}

export interface SSENodeStartPayload {
    node: AgentNodeName;
    timestamp: string;
    stepIndex: number;
    totalSteps: number;
}

export interface SSEToolCallPayload {
    executionId: string;
    toolName: string;
    mcpServer: string;
    inputArgs: Record<string, unknown>;
    requiresApproval: boolean;
}

export interface SSEToolResultPayload {
    executionId: string;
    toolName: string;
    output: unknown;
    durationMs: number;
    success: boolean;
}

export type SSEReflectionPayload = ReflectionSummary;

export interface SSETokenPayload {
    token: string;
    delta: string;
    messageId?: string;
}

export type SSEHitlRequestPayload = HitlRequestPayload;

export interface SSEDonePayload {
    messageId: string;
    finalMarkdown: string;
    citations: CitationItem[];
    tokenUsage: TokenUsageMetrics;
    durationMs: number;
}

export interface SSEErrorPayload {
    code: string;
    message: string;
    details?: unknown;
}

export type SSEEventPayload =
    | { event: 'plan'; data: SSEPlanPayload }
    | { event: 'node_start'; data: SSENodeStartPayload }
    | { event: 'tool_call'; data: SSEToolCallPayload }
    | { event: 'tool_result'; data: SSEToolResultPayload }
    | { event: 'reflection'; data: SSEReflectionPayload }
    | { event: 'token'; data: SSETokenPayload }
    | { event: 'hitl_request'; data: SSEHitlRequestPayload }
    | { event: 'done'; data: SSEDonePayload }
    | { event: 'error'; data: SSEErrorPayload };
