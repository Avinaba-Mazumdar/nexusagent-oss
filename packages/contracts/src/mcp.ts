export interface McpToolParameter {
    type: string;
    description?: string;
    enum?: string[];
    default?: unknown;
}

export interface McpToolInputSchema {
    type: 'object';
    properties: Record<string, McpToolParameter>;
    required?: string[];
}

export interface McpToolSchema {
    name: string;
    description: string;
    inputSchema: McpToolInputSchema;
    mcpServer: string;
    isEnabled: boolean;
    requiresHitl: boolean;
}

export interface McpToolCallRequest {
    toolName: string;
    arguments: Record<string, unknown>;
    mcpServer?: string;
    executionId?: string;
}

export interface McpToolCallResult {
    executionId: string;
    toolName: string;
    result: unknown;
    isError?: boolean;
    durationMs: number;
}

export type McpTransport = 'sse' | 'stdio' | 'http';
export type McpServerStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface McpServerInfo {
    id: string;
    name: string;
    version: string;
    endpoint: string;
    transport: McpTransport;
    status: McpServerStatus;
    toolsCount: number;
    lastPingAt?: string;
}

export interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface McpPromptArgument {
    name: string;
    description?: string;
    required?: boolean;
}

export interface McpPrompt {
    name: string;
    description?: string;
    arguments?: McpPromptArgument[];
}

export interface McpJsonRpcError {
    code: number;
    message: string;
    data?: unknown;
}

export interface McpJsonRpcRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: unknown;
}

export interface McpJsonRpcResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: unknown;
    error?: McpJsonRpcError;
}

export interface McpWireLogEntry {
    id: string;
    timestamp: string;
    direction: 'inbound' | 'outbound';
    transport: McpTransport;
    server: string;
    payload: unknown;
    durationMs?: number;
}
