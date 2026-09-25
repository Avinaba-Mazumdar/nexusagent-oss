'use client';

import * as React from 'react';
import { Activity, CheckCircle2, ChevronRight, Clock, Cpu, GitFork, Hash, Loader2, RefreshCw, Terminal, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PlanStep } from '@nexusagent/contracts';

export interface LogEntry {
    id: string;
    timestamp: string;
    stage: 'ROUTER' | 'RAG' | 'INFERENCE' | 'BYOK' | 'STREAM';
    message: string;
    meta?: Record<string, unknown>;
}

export interface TelemetryMetrics {
    activeModel: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    rpmRemaining?: number;
    isByok: boolean;
}

interface ObservabilityPanelProps {
    metrics: TelemetryMetrics;
    logs: LogEntry[];
    currentNode?: string | null;
    plan?: PlanStep[];
    reflectionScore?: number;
    isStreaming?: boolean;
}

const DAG_NODES = [
    { id: 'planner', label: 'Planner', step: 1 },
    { id: 'retriever', label: 'Retriever', step: 2 },
    { id: 'sandbox', label: 'Sandbox', step: 3 },
    { id: 'critic', label: 'Critic', step: 4 },
    { id: 'synthesizer', label: 'Synthesizer', step: 5 }
];

export function ObservabilityPanel({ metrics, logs, currentNode, plan = [], reflectionScore = 0, isStreaming = false }: ObservabilityPanelProps) {
    const logsEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (typeof logsEndRef.current?.scrollIntoView === 'function') {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <aside
            role="complementary"
            aria-label="Agent Telemetry & Observability"
            className="w-80 lg:w-88 bg-card border-l border-border flex flex-col shrink-0 overflow-y-auto p-4 space-y-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="flex items-center gap-1.5 text-xs font-heading font-bold text-foreground">
                    <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>Real-time Observability</span>
                </h2>
                <Badge variant={metrics.isByok ? 'soft' : 'outline'} className="text-[10px] font-mono">
                    {metrics.isByok ? 'BYOK Mode' : 'Free Tier Edge'}
                </Badge>
            </div>

            {/* Reactive DAG Execution Pipeline Tracker */}
            <Card className="p-3 shadow-2xs border-border bg-secondary/15">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-heading font-semibold text-foreground">
                        <GitFork className="h-3.5 w-3.5 text-primary" />
                        <span>LangGraph DAG Pipeline</span>
                    </div>
                    {isStreaming && (
                        <Badge variant="soft" className="text-[9px] gap-1 px-1.5 py-0 animate-pulse bg-primary/20 text-primary">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            Live
                        </Badge>
                    )}
                </div>

                {/* DAG Node Progress Bar */}
                <div className="flex items-center justify-between gap-1 py-1.5 overflow-x-auto">
                    {DAG_NODES.map((node, index) => {
                        const isCurrent = currentNode === node.id;
                        const isPast = currentNode && DAG_NODES.findIndex((n) => n.id === currentNode) > index;

                        return (
                            <React.Fragment key={node.id}>
                                <div
                                    className={`flex flex-col items-center px-1.5 py-1 rounded text-center min-w-[52px] transition-all ${
                                        isCurrent
                                            ? 'bg-primary text-primary-foreground font-bold shadow-xs scale-105'
                                            : isPast
                                              ? 'bg-primary/20 text-foreground font-medium'
                                              : 'bg-muted/40 text-muted-foreground'
                                    }`}
                                >
                                    <span className="text-[8px] uppercase tracking-tighter opacity-80">{isCurrent ? 'ACTIVE' : `S${node.step}`}</span>
                                    <span className="text-[10px] leading-tight truncate">{node.label}</span>
                                </div>
                                {index < DAG_NODES.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Reflection Critic Score Gauge */}
                {reflectionScore > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 text-primary" />
                            Critic Soundness:
                        </span>
                        <Badge
                            variant="outline"
                            className={`font-mono text-[10px] font-bold ${
                                reflectionScore >= 0.7
                                    ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                                    : 'border-amber-500/50 text-amber-500 bg-amber-500/10'
                            }`}
                        >
                            {(reflectionScore * 100).toFixed(0)}% {reflectionScore >= 0.7 ? '(Grounded)' : '(Re-planning)'}
                        </Badge>
                    </div>
                )}

                {/* Live Plan Execution Steps */}
                {plan.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border space-y-1">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Active Plan Steps ({plan.filter((s) => s.status === 'completed').length}/{plan.length})
                        </div>
                        {plan.map((step) => (
                            <div key={step.stepNumber} className="flex items-start gap-1.5 text-[11px] text-foreground/90 leading-tight">
                                {step.status === 'completed' ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                ) : step.status === 'in_progress' ? (
                                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0 mt-0.5" />
                                ) : (
                                    <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[8px] text-muted-foreground shrink-0 mt-0.5">
                                        {step.stepNumber}
                                    </span>
                                )}
                                <span className={step.status === 'completed' ? 'line-through text-muted-foreground' : ''}>{step.description}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 shadow-2xs border-border bg-secondary/20">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider">Active Model</span>
                        <Cpu className="h-3 w-3 text-primary" />
                    </div>
                    <div className="text-xs font-bold font-mono text-foreground truncate" title={metrics.activeModel}>
                        {metrics.activeModel || 'Idle'}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{metrics.isByok ? 'Direct API Key' : 'Rate-limited auto-cascade'}</div>
                </Card>

                <Card className="p-3 shadow-2xs border-border bg-secondary/20">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider">Total Tokens</span>
                        <Hash className="h-3 w-3 text-primary" />
                    </div>
                    <div className="text-xs font-bold font-mono text-foreground">{metrics.totalTokens.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                        {metrics.promptTokens} in / {metrics.completionTokens} out
                    </div>
                </Card>

                <Card className="p-3 shadow-2xs border-border bg-secondary/20">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider">Latency</span>
                        <Clock className="h-3 w-3 text-amber-500" />
                    </div>
                    <div className="text-xs font-bold font-mono text-foreground">{metrics.latencyMs > 0 ? `${metrics.latencyMs}ms` : '--'}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Edge TTFT &amp; generation</div>
                </Card>

                <Card className="p-3 shadow-2xs border-border bg-secondary/20">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider">Cost / Billing</span>
                        <Zap className="h-3 w-3 text-emerald-500" />
                    </div>
                    <div className="text-xs font-bold font-mono text-emerald-500">{metrics.isByok ? 'Custom Billing' : '$0.00 (Free)'}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{metrics.isByok ? 'Unlimited' : `${metrics.rpmRemaining ?? 15} RPM ceiling`}</div>
                </Card>
            </div>

            {/* Wire Logs Streaming Terminal */}
            <Card className="flex-1 flex flex-col shadow-2xs border-border bg-card overflow-hidden">
                <CardHeader className="p-3 pb-2 border-b border-border bg-secondary/30 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xs font-heading flex items-center gap-1.5">
                            <Terminal className="h-3.5 w-3.5 text-primary" />
                            <span>Execution Wire Logs</span>
                        </CardTitle>
                        <CardDescription className="text-[11px] text-muted-foreground">Telemetry trace &amp; model routing events</CardDescription>
                    </div>
                    <Badge variant="soft" className="text-[9px] px-1.5 py-0 h-4">
                        Live SSE
                    </Badge>
                </CardHeader>
                <CardContent className="p-2.5 flex-1 overflow-y-auto max-h-[320px] font-mono text-[11px] space-y-2 bg-slate-950/90 text-slate-200">
                    {logs.length === 0 ? (
                        <div className="text-slate-500 py-6 text-center text-[10px]">Awaiting agent trigger. Stream logs will appear here.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="leading-snug border-b border-slate-800/60 pb-1.5 last:border-0">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <span>{log.timestamp}</span>
                                    <span
                                        className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                                            log.stage === 'ROUTER'
                                                ? 'bg-blue-900/60 text-blue-300'
                                                : log.stage === 'RAG'
                                                  ? 'bg-purple-900/60 text-purple-300'
                                                  : log.stage === 'BYOK'
                                                    ? 'bg-emerald-900/60 text-emerald-300'
                                                    : 'bg-amber-900/60 text-amber-300'
                                        }`}
                                    >
                                        [{log.stage}]
                                    </span>
                                </div>
                                <p className="text-slate-300 mt-0.5 break-words">{log.message}</p>
                            </div>
                        ))
                    )}
                    <div ref={logsEndRef} />
                </CardContent>
            </Card>
        </aside>
    );
}
