'use client';

import * as React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import { NexusLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface HeaderProps {
    version?: string;
    quota?: string;
    interval?: string;
    onGuestLogin?: () => void;
}

export function Header({ version = 'Archon v0.1.0', quota = 'Quota: 5/5 Available', interval = 'last 5 min', onGuestLogin }: HeaderProps) {
    return (
        <header
            role="banner"
            aria-label="Command Center Navigation"
            className="h-14 bg-white border-b border-[#cbd5e1] px-4 md:px-6 flex items-center justify-between shrink-0 z-30"
        >
            <div className="flex items-center gap-3">
                <NexusLogo className="h-8 w-8 rounded-xl shadow-xs shrink-0" aria-hidden="true" />
                <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm tracking-tight text-[#0f172a]">NexusAgent</span>
                    <span className="text-[#004182] text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#e8f3fc] border border-[#93c5fd]">{version}</span>
                </div>
            </div>

            <nav aria-label="System Actions and Session Controls" className="flex items-center gap-2 md:gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-[#f4f5f8] border border-[#cbd5e1] rounded-xl px-3 py-1.5 text-xs text-[#334155]">
                    <span className="font-bold text-[#0f172a]">Interval:</span>
                    <span className="font-medium">{interval}</span>
                </div>

                <Badge variant="soft" className="font-mono text-xs hidden md:inline-flex">
                    {quota}
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
                    onClick={onGuestLogin}
                    aria-label="Claim 1-Click Guest Pass access"
                    className="text-xs font-bold gap-1.5 rounded-xl shadow-xs"
                >
                    <Zap className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    <span>1-Click Guest Pass</span>
                </Button>
            </nav>
        </header>
    );
}
