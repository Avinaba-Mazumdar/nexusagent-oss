export interface SandboxRunRequest {
    code: string;
    timeoutSeconds?: number;
}

export interface SandboxRunResponse {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    astValid: boolean;
    securityViolations: string[];
}
