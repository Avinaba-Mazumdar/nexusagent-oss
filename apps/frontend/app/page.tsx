'use client';

import * as React from 'react';
import type { AgentNodeName, CitationItem, StepNode } from '@nexusagent/contracts';
import { Activity, Cpu, Database, FileCode, Network, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Home() {
    const [ragActive, setRagActive] = React.useState(true);
    const [sandboxActive, setSandboxActive] = React.useState(true);
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
        { id: '3', name: 'reflection', label: 'Reflection Critic', status: 'running' }
    ]);

    return (
        <TooltipProvider>
            <main className="min-h-screen bg-background text-foreground flex flex-col">
                {/* Header Bar */}
                <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                            <Cpu className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="font-heading font-bold text-base tracking-tight text-white flex items-center gap-2">
                                NexusAgent
                                <span className="text-primary text-xs font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                                    Archon v0.1.0
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="citation">Quota: 5/5 Available</Badge>
                        <Badge variant="success" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            OWASP ASI Guard Active
                        </Badge>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="glass">
                                    System Info
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>System Topology</DialogTitle>
                                    <DialogDescription>
                                        NexusAgent autonomous systems analyst running on Next.js 16, React 19, Neon PostgreSQL 18 with pgvector, and FastAPI MCP
                                        v2.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="text-xs font-mono space-y-2 py-3 bg-[#0b0f19] p-3 rounded-lg border border-white/5 text-slate-300">
                                    <div>Engine: LangGraph 1.2 Multi-Step DAG</div>
                                    <div>Database: Neon PostgreSQL 18 (HNSW Indexing)</div>
                                    <div>Protocol: Model Context Protocol (MCP v2)</div>
                                    <div>Font: Instrument Sans (Geometric Sans-Serif)</div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="default">
                            1-Click Guest Pass
                        </Button>
                    </div>
                </header>

                {/* 4-Zone Command Center Preview / Showcase */}
                <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold font-heading tracking-tight text-white flex items-center gap-2">
                            Autonomous Systems Intelligence Command Center
                            <Sparkles className="h-5 w-5 text-cyan-400" />
                        </h1>
                        <p className="text-sm text-muted-foreground font-sans">
                            Evaluate distributed systems RFCs, cross-reference consensus guarantees, and verify latency models.
                        </p>
                    </div>

                    {/* Grid Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Zone 1: Workspace & Tool Toggles */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Database className="h-4 w-4 text-cyan-400" />
                                    Zone 1: Document Vault & Tools
                                </CardTitle>
                                <CardDescription>Active knowledge bases and execution tools</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-white/5 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                                        <span className="font-mono">RFC-104-raft-consensus.md</span>
                                    </div>
                                    <Badge variant="citation">18 chunks</Badge>
                                </div>

                                <div className="pt-2 border-t border-white/5 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Neon Hybrid RAG (pgvector)</span>
                                        <Switch checked={ragActive} onCheckedChange={setRagActive} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">AST Python Sandbox</span>
                                        <Switch checked={sandboxActive} onCheckedChange={setSandboxActive} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Zone 2: Active Chat Canvas */}
                        <Card className="border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.06)]">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Terminal className="h-4 w-4 text-cyan-400" />
                                    Zone 2: Active Chat Canvas
                                </CardTitle>
                                <CardDescription>Sub-600ms streaming verdicts & dynamic diagrams</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-xs p-3 rounded-lg bg-[#0b0f19] border border-white/5 space-y-2 font-sans">
                                    <div className="text-cyan-400 font-mono text-[11px] flex items-center gap-1.5">
                                        <Activity className="h-3 w-3 animate-pulse" />
                                        Agent Status: Synthesizing Verdict ({currentNode})
                                    </div>
                                    <p className="text-slate-300 leading-relaxed text-xs">
                                        Raft leader election guarantees safety under partition via strict quorum majorities. Verified against{' '}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge variant="citation" className="text-[10px]">
                                                    {activeCitation.formattedBadge}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>Jump to Raft Log Replication section in document vault</TooltipContent>
                                        </Tooltip>
                                        .
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button size="sm" variant="default" className="flex-1">
                                        Execute Plan
                                    </Button>
                                    <Button size="sm" variant="emerald">
                                        Approve Tool
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Zone 3: Live Observability */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Network className="h-4 w-4 text-emerald-400" />
                                    Zone 3: Live Observability
                                </CardTitle>
                                <CardDescription>Real-time DAG telemetry & MCP inspector</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="dag" className="w-full">
                                    <TabsList className="w-full grid grid-cols-2">
                                        <TabsTrigger value="dag">Agent DAG</TabsTrigger>
                                        <TabsTrigger value="wire">MCP Wire</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="dag" className="pt-2">
                                        <div className="space-y-1.5 text-xs font-mono text-slate-300 bg-[#0b0f19] p-3 rounded-lg border border-white/5">
                                            {sampleNodes.map((node, i) => (
                                                <div
                                                    key={node.id}
                                                    className={node.status === 'completed' ? 'text-emerald-400' : 'text-cyan-400 flex items-center gap-1.5'}
                                                >
                                                    {node.status === 'completed' ? (
                                                        `✓ [${i + 1}] ${node.label.toUpperCase()}_DONE`
                                                    ) : (
                                                        <>
                                                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                                                            {`[${i + 1}] ${node.label.toUpperCase()}_RUNNING`}
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="wire" className="pt-2">
                                        <div className="text-[11px] font-mono p-3 bg-[#0b0f19] rounded-lg border border-white/5 text-slate-400 overflow-x-auto">
                                            {`{"jsonrpc":"2.0","method":"tools/call","params":{"name":"hybrid_rag"}}`}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </TooltipProvider>
    );
}
