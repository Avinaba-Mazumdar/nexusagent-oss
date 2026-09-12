'use client';

import * as React from 'react';
import { Activity, Database, LogIn, Send, Terminal, Zap } from 'lucide-react';
import { NexusLogo } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function Home() {
    const [prompt, setPrompt] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPrompt('');
    };

    return (
        <div className="h-screen flex flex-col bg-[#f4f5f8] text-[#0f172a] font-sans overflow-hidden">
            {/* 1. Header */}
            <header
                role="banner"
                aria-label="Command Center Navigation"
                className="h-14 bg-white border-b border-[#cbd5e1] px-4 md:px-6 flex items-center justify-between shrink-0 z-30"
            >
                <div className="flex items-center gap-3">
                    <NexusLogo className="h-8 w-8 rounded-xl shadow-xs shrink-0" aria-hidden="true" />
                    <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm tracking-tight text-[#0f172a]">NexusAgent</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="default" className="text-xs font-bold gap-1.5 rounded-xl">
                                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Sign In</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xs">
                            <DialogHeader>
                                <DialogTitle>Sign In</DialogTitle>
                                <DialogDescription className="text-xs">Sign in to your account or continue as a guest.</DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-2.5 pt-2">
                                <Button variant="outline" className="w-full justify-center gap-2 text-xs font-medium border-[#cbd5e1] hover:bg-[#f8fafc]">
                                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                        />
                                    </svg>
                                    <span>Google Sign In</span>
                                </Button>
                                <Button variant="secondary" className="w-full justify-center gap-2 text-xs font-medium">
                                    <Zap className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                                    <span>Guest Sign In</span>
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* 3-Zone Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* 2. Workspace Panel (Left) */}
                <aside
                    role="complementary"
                    aria-label="Workspace & Tools"
                    className="w-72 lg:w-80 bg-white border-r border-[#cbd5e1] flex flex-col shrink-0 overflow-y-auto p-4 space-y-4"
                >
                    <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
                        <h2 className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#0f172a]">
                            <Database className="h-3.5 w-3.5 text-[#004ea1]" aria-hidden="true" />
                            <span>Workspace &amp; Tools</span>
                        </h2>
                    </div>

                    <Card className="border-[#cbd5e1] shadow-2xs">
                        <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-xs font-heading">Document Vault</CardTitle>
                            <CardDescription className="text-xs text-[#334155]">Indexed architectural RFCs</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <p className="text-xs text-[#334155]">Connect knowledge bases and view document chunks in Phase 3.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-[#cbd5e1] shadow-2xs">
                        <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-xs font-heading">Tool Registry</CardTitle>
                            <CardDescription className="text-xs text-[#334155]">MCP v2 server tools &amp; execution</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <p className="text-xs text-[#334155]">MCP tool controls and sandbox policies configure in Phase 4 &amp; 5.</p>
                        </CardContent>
                    </Card>
                </aside>

                {/* 3. Synthesis Canvas (Center) */}
                <main role="main" aria-label="Active Synthesis Canvas" className="flex-1 flex flex-col overflow-hidden bg-[#f4f5f8]">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        <div className="flex items-center justify-between bg-white border border-[#cbd5e1] rounded-xl px-4 py-2.5 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-[#0f172a]">Synthesis Canvas</span>
                                <Badge variant="soft">Ready</Badge>
                            </div>
                        </div>

                        <Card className="border-[#cbd5e1] bg-white shadow-xs">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-heading font-bold text-[#0f172a]">Autonomous Systems Intelligence</CardTitle>
                                <CardDescription className="text-xs text-[#334155]">
                                    Real-time LangGraph agent output, streaming markdown verdicts, and architecture diagrams.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#334155] leading-relaxed">
                                    Canvas active. Awaiting architectural inquiry or simulation trigger.
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        role="search"
                        aria-label="Architecture inquiry input"
                        className="p-4 bg-white border-t border-[#cbd5e1] shrink-0"
                    >
                        <div className="relative flex items-center">
                            <Input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ask architectural question or paste RFC snippet..."
                                className="pr-24 min-h-[44px] text-xs rounded-xl bg-[#f8fafc] border-[#64748b] focus-visible:bg-white"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                variant="default"
                                aria-label="Send query"
                                className="absolute right-1.5 h-8 px-4 text-xs rounded-lg gap-1.5 font-bold"
                            >
                                <span>Send</span>
                                <Send className="h-3 w-3" aria-hidden="true" />
                            </Button>
                        </div>
                    </form>
                </main>

                {/* 4. Observability Panel (Right) */}
                <aside
                    role="complementary"
                    aria-label="Agent Telemetry & Observability"
                    className="w-80 lg:w-84 bg-white border-l border-[#cbd5e1] flex flex-col shrink-0 overflow-y-auto p-4 space-y-4"
                >
                    <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
                        <h2 className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#0f172a]">
                            <Activity className="h-3.5 w-3.5 text-[#004ea1]" aria-hidden="true" />
                            <span>Observability</span>
                        </h2>
                    </div>

                    <Card className="border-[#cbd5e1] shadow-2xs">
                        <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-xs font-heading">DAG Telemetry</CardTitle>
                            <CardDescription className="text-xs text-[#334155]">LangGraph cycle state</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <p className="text-xs text-[#334155]">Execution graphs and node telemetry activate in Phase 4 &amp; 7.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-[#cbd5e1] shadow-2xs">
                        <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-xs font-heading flex items-center gap-1.5">
                                <Terminal className="h-3.5 w-3.5 text-[#004ea1]" aria-hidden="true" />
                                <span>Wire Logs</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-[#334155]">Real-time protocol streaming</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <p className="text-xs text-[#334155]">SSE streaming trace logs activate in Phase 7.</p>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
