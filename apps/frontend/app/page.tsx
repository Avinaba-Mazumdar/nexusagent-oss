'use client';

import * as React from 'react';
import type { AgentNodeName, CitationItem, StepNode } from '@nexusagent/contracts';
import { Activity, Database, Send, ShieldCheck, SlidersHorizontal, Terminal, UploadCloud, Zap } from 'lucide-react';
import { NexusLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function Home() {
    const [ragActive, setRagActive] = React.useState(true);
    const [sandboxActive, setSandboxActive] = React.useState(true);
    const [sqlAuditActive, setSqlAuditActive] = React.useState(false);
    const [inputPrompt, setInputPrompt] = React.useState('');

    const [currentNode] = React.useState<AgentNodeName>('reflection');
    const [activeCitation] = React.useState<CitationItem>({
        id: 'cite-1',
        documentId: 'doc-rfc104',
        filename: 'RFC-104-raft-consensus.md',
        startLine: 128,
        endLine: 145,
        snippet: 'Raft leader election guarantees safety under partition...',
        relevanceScore: 0.94,
        formattedBadge: 'RFC-104:L128-145'
    });

    const [sampleNodes] = React.useState<StepNode[]>([
        { id: '1', name: 'planner', label: 'Planner Node', status: 'completed' },
        { id: '2', name: 'retriever', label: 'Retriever Node', status: 'completed' },
        { id: '3', name: 'reflection', label: 'Reflection Critic', status: 'running' },
        { id: '4', name: 'synthesizer', label: 'Synthesizer Stream', status: 'idle' }
    ]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <TooltipProvider>
            <a href="#main-canvas" className="skip-link">
                Skip to main content
            </a>

            <div className="h-screen flex flex-col bg-[#f4f5f8] text-[#0f172a] font-sans overflow-hidden">
                <header
                    role="banner"
                    aria-label="Command Center Navigation"
                    className="h-14 bg-white border-b border-[#cbd5e1] px-4 md:px-6 flex items-center justify-between shrink-0 z-30"
                >
                    <div className="flex items-center gap-3">
                        <NexusLogo className="h-8 w-8 rounded-xl shadow-xs shrink-0" aria-hidden="true" />
                        <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-sm tracking-tight text-[#0f172a]">NexusAgent</span>
                            <span className="text-[#004182] text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#e8f3fc] border border-[#93c5fd]">
                                Archon v0.1.0
                            </span>
                        </div>
                    </div>

                    <nav aria-label="System Actions and Session Controls" className="flex items-center gap-2 md:gap-3">
                        <div className="hidden sm:flex items-center gap-2 bg-[#f4f5f8] border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-xs text-[#334155]">
                            <span className="font-bold text-[#0f172a]">Interval:</span>
                            <span className="font-medium">last 5 min</span>
                        </div>

                        <Badge variant="soft" className="font-mono text-xs hidden md:inline-flex">
                            Quota: 5/5 Available
                        </Badge>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    aria-label="Open System Topology and Configuration dialog"
                                    className="text-xs gap-1.5 rounded-xl text-[#0f172a]"
                                >
                                    <ShieldCheck className="h-3.5 w-3.5 text-[#004ea1]" aria-hidden="true" />
                                    <span>Topology</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <NexusLogo className="h-5 w-5 rounded-md shrink-0" aria-hidden="true" />
                                        <span>System Topology &amp; Configuration</span>
                                    </DialogTitle>
                                    <DialogDescription>
                                        NexusAgent Autonomous Systems Analyst running on Next.js 16, TypeScript 7, Neon PostgreSQL 18, and FastAPI.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="text-xs font-mono space-y-2 py-3 bg-[#f8fafc] p-4 rounded-xl border border-[#cbd5e1] text-[#1e293b]">
                                    <div className="flex justify-between">
                                        <span className="text-[#334155]">Engine:</span>
                                        <span className="font-bold text-[#0f172a]">LangGraph 1.2 Multi-Step DAG</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#334155]">Database:</span>
                                        <span className="font-bold text-[#004ea1]">Neon PostgreSQL 18 (pgvector HNSW)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#334155]">Accessibility:</span>
                                        <span className="font-bold text-[#14532d]">WCAG 2.2 Level AAA Compliant</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#334155]">Primary Theme:</span>
                                        <span className="font-bold text-[#0f172a]">Light Mode (Archon Blue #004ea1)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#334155]">Layout:</span>
                                        <span className="font-bold text-[#0f172a]">4-Zone Architecture</span>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            size="sm"
                            variant="default"
                            aria-label="Start 1-Click Guest Pass session with 5 free query tokens"
                            className="text-xs font-bold"
                        >
                            1-Click Guest Pass
                        </Button>
                    </nav>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    <aside
                        aria-label="Workspace and Tool Configuration"
                        className="w-72 lg:w-80 bg-white border-r border-[#cbd5e1] flex flex-col shrink-0 overflow-y-auto p-4 space-y-4"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
                            <h2 className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#0f172a]">
                                <Database className="h-3.5 w-3.5 text-[#004ea1]" aria-hidden="true" />
                                <span>Workspace &amp; Tools</span>
                            </h2>
                            <Badge variant="secondary" className="text-[10px]">
                                Zone 1
                            </Badge>
                        </div>

                        <Card className="border-[#cbd5e1] shadow-2xs">
                            <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-xs font-heading flex items-center justify-between">
                                    <span>Document Vault</span>
                                    <Badge variant="soft" className="text-[10px]">
                                        2 Files
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-xs text-[#334155]">Active RFCs &amp; architecture whitepapers</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-2">
                                <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-mono text-xs font-bold text-[#0f172a] truncate max-w-[170px]">RFC-104-raft.md</span>
                                        <Badge variant="soft" className="text-[10px]">
                                            18 chunks
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-[#334155] font-medium">Indexed: pgvector + tsvector</div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-mono text-xs font-bold text-[#0f172a] truncate max-w-[170px]">Neon-Storage.md</span>
                                        <Badge variant="secondary" className="text-[10px]">
                                            12 chunks
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-[#334155] font-medium">Indexed: pgvector HNSW</div>
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    aria-label="Upload architecture whitepaper or RFC document"
                                    className="w-full text-xs rounded-xl gap-1.5 bg-white text-[#0f172a]"
                                >
                                    <UploadCloud className="h-3.5 w-3.5 text-[#004ea1]" aria-hidden="true" />
                                    <span>Upload Architecture Doc</span>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-[#cbd5e1] shadow-2xs">
                            <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-xs font-heading flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Zap className="h-3.5 w-3.5 text-[#004ea1]" aria-hidden="true" />
                                        Active MCP Server
                                    </span>
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#14532d]" role="status" aria-label="Server status: Connected" />
                                </CardTitle>
                                <CardDescription className="text-xs text-[#334155]">Model Context Protocol v2 Endpoint</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-[#cbd5e1] text-xs font-mono font-medium text-[#1e293b] truncate">
                                    localhost:8000/api/mcp/sse
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#cbd5e1] shadow-2xs">
                            <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-xs font-heading flex items-center gap-1.5">
                                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#004ea1]" aria-hidden="true" />
                                    <span>Tool Toggles</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <label htmlFor="toggle-rag" className="cursor-pointer pr-2">
                                        <div className="font-bold text-[#0f172a]">Hybrid RAG Search</div>
                                        <div className="text-xs text-[#334155]">Neon pgvector + BM25</div>
                                    </label>
                                    <Switch id="toggle-rag" aria-label="Toggle Hybrid RAG Search tool" checked={ragActive} onCheckedChange={setRagActive} />
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <label htmlFor="toggle-sandbox" className="cursor-pointer pr-2">
                                        <div className="font-bold text-[#0f172a]">AST Python Sandbox</div>
                                        <div className="text-xs text-[#334155]">Math &amp; latency validator</div>
                                    </label>
                                    <Switch
                                        id="toggle-sandbox"
                                        aria-label="Toggle AST Python Sandbox tool"
                                        checked={sandboxActive}
                                        onCheckedChange={setSandboxActive}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <label htmlFor="toggle-sql" className="cursor-pointer pr-2">
                                        <div className="font-bold text-[#0f172a]">SQL Schema Audit</div>
                                        <div className="text-xs text-[#334155]">Index efficiency checker</div>
                                    </label>
                                    <Switch
                                        id="toggle-sql"
                                        aria-label="Toggle SQL Schema Audit tool"
                                        checked={sqlAuditActive}
                                        onCheckedChange={setSqlAuditActive}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </aside>

                    <main
                        id="main-canvas"
                        role="main"
                        aria-label="Active Synthesis and Chat Canvas"
                        className="flex-1 flex flex-col overflow-hidden bg-[#f4f5f8]"
                    >
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
                                    Evaluate partition tolerances and Raft leader election safety guarantees against RFC-104. Does the proposed architecture
                                    prevent split-brain write corruption during a network split?
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
                                            The proposed architecture maintains strict linearizability across partitions. During network split scenarios,
                                            minority partitions gracefully reject write operations, preventing stale state propagation as specified in section
                                            4.2 of{' '}
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
                                                    Jump to Raft Log Replication section in document vault (Lines {activeCitation.startLine}-
                                                    {activeCitation.endLine})
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
                                            aria-label="Execute proposed architectural plan"
                                            className="rounded-xl text-xs font-bold"
                                        >
                                            Execute Plan
                                        </Button>
                                        <Button
                                            size="default"
                                            variant="dark"
                                            aria-label="Approve pending tool execution in sandbox"
                                            className="rounded-xl text-xs font-bold"
                                        >
                                            Approve Tool Execution
                                        </Button>
                                        <Button
                                            size="default"
                                            variant="secondary"
                                            aria-label="Copy Mermaid architecture diagram markup to clipboard"
                                            className="rounded-xl text-xs font-bold"
                                        >
                                            Copy Mermaid Diagram
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <form
                            onSubmit={handleFormSubmit}
                            role="search"
                            aria-label="Architecture inquiry input"
                            className="p-4 bg-white border-t border-[#cbd5e1] shrink-0"
                        >
                            <label htmlFor="prompt-input" className="sr-only">
                                Ask architectural question or paste RFC snippet
                            </label>
                            <div className="relative flex items-center">
                                <Input
                                    id="prompt-input"
                                    value={inputPrompt}
                                    onChange={(e) => setInputPrompt(e.target.value)}
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
                                {sampleNodes.map((node, i) => (
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
                                        <Badge
                                            variant={node.status === 'completed' ? 'success' : node.status === 'running' ? 'soft' : 'secondary'}
                                            className="text-[10px]"
                                        >
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
                                    <span className="text-xs font-mono font-bold text-[#14532d]">$0.00018</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-[#cbd5e1]">
                                    <span className="text-[#334155] font-medium">Prompt Tokens:</span>
                                    <span className="font-mono font-bold text-[#0f172a]">1,420</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#cbd5e1]">
                                    <span className="text-[#334155] font-medium">Completion Tokens:</span>
                                    <span className="font-mono font-bold text-[#0f172a]">384</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#cbd5e1]">
                                    <span className="text-[#334155] font-medium">Cached Tokens:</span>
                                    <span className="font-mono font-bold text-[#004182]">890 (90% off)</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="font-bold text-[#0f172a]">Total Tokens:</span>
                                    <span className="font-mono font-bold text-[#0f172a]">1,804</span>
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
                </div>
            </div>
        </TooltipProvider>
    );
}
