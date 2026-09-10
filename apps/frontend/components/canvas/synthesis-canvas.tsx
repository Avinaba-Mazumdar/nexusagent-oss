'use client';

import * as React from 'react';
import type { AgentNodeName, CitationItem } from '@nexusagent/contracts';
import { Activity, Send } from 'lucide-react';
import { NexusLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

export interface SynthesisCanvasProps {
    currentNode?: AgentNodeName;
    activeCitation?: CitationItem;
    inputPrompt: string;
    onInputPromptChange: (prompt: string) => void;
    onSubmitPrompt: (e: React.FormEvent) => void;
    onExecutePlan?: () => void;
    onApproveTool?: () => void;
    onCopyMermaid?: () => void;
}

const defaultCitation: CitationItem = {
    id: 'cite-1',
    documentId: 'doc-rfc104',
    filename: 'RFC-104-raft-consensus.md',
    startLine: 128,
    endLine: 145,
    snippet: 'Raft leader election guarantees safety under partition...',
    relevanceScore: 0.94,
    formattedBadge: 'RFC-104:L128-145'
};

export function SynthesisCanvas({
    currentNode = 'reflection',
    activeCitation = defaultCitation,
    inputPrompt,
    onInputPromptChange,
    onSubmitPrompt,
    onExecutePlan,
    onApproveTool,
    onCopyMermaid
}: SynthesisCanvasProps) {
    return (
        <main id="main-canvas" role="main" aria-label="Active Synthesis and Chat Canvas" className="flex-1 flex flex-col overflow-hidden bg-[#f4f5f8]">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between bg-white border border-[#cbd5e1] rounded-xl px-4 py-2.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#0f172a]">Active Cluster:</span>
                        <Badge variant="soft">Raft 3-Node Quorum</Badge>
                        <span className="text-[#64748b]" aria-hidden="true">
                            •
                        </span>
                        <span className="text-[#334155] font-semibold">Consensus: 3/3 Sync</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                        Center Canvas
                    </Badge>
                </div>

                <Card className="border-[#cbd5e1] shadow-xs">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#0f172a]">Staff Systems Architect (You)</span>
                            <time dateTime="12:30:00" className="text-xs font-mono text-[#334155] font-medium">
                                12:30:00
                            </time>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm text-[#1e293b] leading-relaxed">
                        Evaluate partition tolerances and Raft leader election safety guarantees against RFC-104. Does the proposed architecture prevent
                        split-brain write corruption during a network split?
                    </CardContent>
                </Card>

                <Card className="border-[#004ea1]/40 shadow-sm ring-1 ring-[#004ea1]/20 bg-white" aria-live="polite" aria-atomic="true">
                    <CardHeader className="p-4 pb-3 border-b border-[#cbd5e1]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <NexusLogo className="h-5 w-5 rounded-md shadow-2xs shrink-0" aria-hidden="true" />
                                <CardTitle className="text-sm font-heading font-bold text-[#0f172a]">NexusAgent Systems Verdict</CardTitle>
                            </div>
                            <Badge variant="soft" className="text-xs">
                                Active Node: {currentNode}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#cbd5e1] space-y-2 text-sm leading-relaxed text-[#1e293b]">
                            <div className="flex items-center gap-1.5 text-[#004182] font-bold text-sm">
                                <Activity className="h-4 w-4" aria-hidden="true" />
                                <span>Verdict: Quorum Invariants Verified Safe</span>
                            </div>
                            <div className="leading-relaxed">
                                The proposed architecture maintains strict linearizability across partitions. During network split scenarios, minority
                                partitions gracefully reject write operations, preventing stale state propagation as specified in section 4.2 of{' '}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            aria-label={`Jump to citation in ${activeCitation.filename}, lines ${activeCitation.startLine} to ${activeCitation.endLine}`}
                                            className="inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004182]"
                                        >
                                            <Badge variant="citation" className="text-xs">
                                                {activeCitation.formattedBadge}
                                            </Badge>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Jump to Raft Log Replication section in document vault (Lines {activeCitation.startLine}-{activeCitation.endLine})
                                    </TooltipContent>
                                </Tooltip>
                                . Neon PostgreSQL 18 HNSW vector search verified zero conflicting split-brain write conditions.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-heading font-bold text-[#0f172a]">Radis-Master</span>
                                    <Badge variant="soft" className="text-[10px]">
                                        Active
                                    </Badge>
                                </div>
                                <div className="text-xs font-mono font-semibold text-[#334155]">US-east-lb: 150 kbps</div>
                            </div>

                            <div className="bg-[#f8fafc] border border-[#004ea1]/30 rounded-xl p-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-heading font-bold text-[#004182]">sdkclient.eng...</span>
                                    <Badge variant="success" className="text-[10px]">
                                        Quorum
                                    </Badge>
                                </div>
                                <div className="text-xs font-mono font-semibold text-[#334155]">3/3 Nodes Sync</div>
                            </div>

                            <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-heading font-bold text-[#0f172a]">Neon-Storage</span>
                                    <Badge variant="secondary" className="text-[10px]">
                                        pgvector
                                    </Badge>
                                </div>
                                <div className="text-xs font-mono font-semibold text-[#334155]">HNSW Indexed</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button
                                size="default"
                                variant="default"
                                onClick={onExecutePlan}
                                aria-label="Execute proposed architectural plan"
                                className="rounded-xl text-xs font-bold"
                            >
                                Execute Plan
                            </Button>
                            <Button
                                size="default"
                                variant="dark"
                                onClick={onApproveTool}
                                aria-label="Approve pending tool execution in sandbox"
                                className="rounded-xl text-xs font-bold"
                            >
                                Approve Tool Execution
                            </Button>
                            <Button
                                size="default"
                                variant="secondary"
                                onClick={onCopyMermaid}
                                aria-label="Copy Mermaid architecture diagram markup to clipboard"
                                className="rounded-xl text-xs font-bold"
                            >
                                Copy Mermaid Diagram
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <form onSubmit={onSubmitPrompt} role="search" aria-label="Architecture inquiry input" className="p-4 bg-white border-t border-[#cbd5e1] shrink-0">
                <label htmlFor="prompt-input" className="sr-only">
                    Ask architectural question or paste RFC snippet
                </label>
                <div className="relative flex items-center">
                    <Input
                        id="prompt-input"
                        value={inputPrompt}
                        onChange={(e) => onInputPromptChange(e.target.value)}
                        placeholder="Ask architectural question or paste RFC snippet (e.g. Raft consensus, Neon pgvector latency)..."
                        className="pr-24 min-h-[44px] text-xs rounded-xl bg-[#f8fafc] border-[#64748b] focus-visible:bg-white"
                    />
                    <Button
                        type="submit"
                        size="sm"
                        variant="default"
                        aria-label="Send architectural question to NexusAgent"
                        className="absolute right-1.5 h-8 px-4 text-xs rounded-lg gap-1.5 font-bold"
                    >
                        <span>Send</span>
                        <Send className="h-3 w-3" aria-hidden="true" />
                    </Button>
                </div>
            </form>
        </main>
    );
}
