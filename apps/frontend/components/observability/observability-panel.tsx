'use client';

import * as React from 'react';
import type { StepNode } from '@nexusagent/contracts';
import { Activity, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ObservabilityPanelProps {
    nodes?: StepNode[];
    costFormatted?: string;
    promptTokens?: number;
    completionTokens?: number;
    cachedTokens?: number;
    totalTokens?: number;
}

const defaultNodes: StepNode[] = [
    { id: '1', name: 'planner', label: 'Planner Node', status: 'completed' },
    { id: '2', name: 'retriever', label: 'Retriever Node', status: 'completed' },
    { id: '3', name: 'reflection', label: 'Reflection Critic', status: 'running' },
    { id: '4', name: 'synthesizer', label: 'Synthesizer Stream', status: 'idle' }
];

export function ObservabilityPanel({
    nodes = defaultNodes,
    costFormatted = '$0.00018',
    promptTokens = 1420,
    completionTokens = 384,
    cachedTokens = 890,
    totalTokens = 1804
}: ObservabilityPanelProps) {
    return (
        <aside
            aria-label="Agent Observability and DAG Telemetry"
            className="w-80 lg:w-84 bg-white border-l border-[#cbd5e1] flex flex-col shrink-0 overflow-y-auto p-4 space-y-4"
        >
            <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
                <h2 className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#0f172a]">
                    <Activity className="h-3.5 w-3.5 text-[#004ea1]" aria-hidden="true" />
                    <span>Agent Inspector</span>
                </h2>
                <Badge variant="secondary" className="text-[10px]">
                    Zone 3
                </Badge>
            </div>

            <Card className="border-[#cbd5e1] shadow-2xs">
                <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-xs font-heading flex items-center justify-between">
                        <span>Execution Pipeline</span>
                        <span className="text-xs font-mono font-bold text-[#004ea1]">Node 3/4</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-[#334155]">LangGraph cyclical execution graph</CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                    {nodes.map((node, i) => (
                        <div
                            key={node.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                                node.status === 'running'
                                    ? 'bg-[#e8f3fc] border-[#93c5fd] text-[#004182]'
                                    : node.status === 'completed'
                                      ? 'bg-[#f8fafc] border-[#cbd5e1] text-[#0f172a]'
                                      : 'bg-white border-[#e2e8f0] text-[#475569]'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#334155]">0{i + 1}</span>
                                <span className="font-bold">{node.label}</span>
                            </div>
                            <Badge variant={node.status === 'completed' ? 'success' : node.status === 'running' ? 'soft' : 'secondary'} className="text-[10px]">
                                {node.status}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="border-[#cbd5e1] shadow-2xs">
                <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-xs font-heading flex items-center justify-between">
                        <span>Token Usage &amp; Cost</span>
                        <span className="text-xs font-mono font-bold text-[#14532d]">{costFormatted}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#cbd5e1]">
                        <span className="text-[#334155] font-medium">Prompt Tokens:</span>
                        <span className="font-mono font-bold text-[#0f172a]">{promptTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#cbd5e1]">
                        <span className="text-[#334155] font-medium">Completion Tokens:</span>
                        <span className="font-mono font-bold text-[#0f172a]">{completionTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#cbd5e1]">
                        <span className="text-[#334155] font-medium">Cached Tokens:</span>
                        <span className="font-mono font-bold text-[#004182]">{cachedTokens.toLocaleString()} (90% off)</span>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span className="font-bold text-[#0f172a]">Total Tokens:</span>
                        <span className="font-mono font-bold text-[#0f172a]">{totalTokens.toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-[#cbd5e1] shadow-2xs">
                <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-xs font-heading flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-[#004ea1]" aria-hidden="true" />
                        <span>Execution Trace</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                    <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#cbd5e1] font-mono text-xs space-y-1.5 text-[#1e293b]">
                        <div className="text-[#14532d] font-semibold">✓ 12:30:01 [Planner] Decomposed 3 sub-goals</div>
                        <div className="text-[#14532d] font-semibold">✓ 12:30:02 [RAG] Neon pgvector 4 chunks</div>
                        <div className="text-[#004182] font-bold">● 12:30:03 [Critic] Confidence 0.94</div>
                    </div>

                    <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#cbd5e1] font-mono text-xs text-[#334155] truncate">
                        {`{"jsonrpc":"2.0","method":"tools/call"}`}
                    </div>
                </CardContent>
            </Card>
        </aside>
    );
}
