'use client';

import * as React from 'react';
import { Database, SlidersHorizontal, UploadCloud, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export interface WorkspacePanelProps {
    ragActive: boolean;
    onRagChange: (active: boolean) => void;
    sandboxActive: boolean;
    onSandboxChange: (active: boolean) => void;
    sqlAuditActive: boolean;
    onSqlAuditChange: (active: boolean) => void;
    onUploadDoc?: () => void;
}

export function WorkspacePanel({ ragActive, onRagChange, sandboxActive, onSandboxChange, sqlAuditActive, onSqlAuditChange, onUploadDoc }: WorkspacePanelProps) {
    return (
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
                        onClick={onUploadDoc}
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
                        <Switch id="toggle-rag" aria-label="Toggle Hybrid RAG Search tool" checked={ragActive} onCheckedChange={onRagChange} />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <label htmlFor="toggle-sandbox" className="cursor-pointer pr-2">
                            <div className="font-bold text-[#0f172a]">AST Python Sandbox</div>
                            <div className="text-xs text-[#334155]">Math &amp; latency validator</div>
                        </label>
                        <Switch id="toggle-sandbox" aria-label="Toggle AST Python Sandbox tool" checked={sandboxActive} onCheckedChange={onSandboxChange} />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <label htmlFor="toggle-sql" className="cursor-pointer pr-2">
                            <div className="font-bold text-[#0f172a]">SQL Schema Audit</div>
                            <div className="text-xs text-[#334155]">Index efficiency checker</div>
                        </label>
                        <Switch id="toggle-sql" aria-label="Toggle SQL Schema Audit tool" checked={sqlAuditActive} onCheckedChange={onSqlAuditChange} />
                    </div>
                </CardContent>
            </Card>
        </aside>
    );
}
