'use client';

import * as React from 'react';
import Script from 'next/script';
import { Activity, Database, Loader2, LogIn, LogOut, Moon, Send, Sun, Terminal, User } from 'lucide-react';
import { NexusLogo } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/auth-store';

export default function Home() {
    const [prompt, setPrompt] = React.useState('');
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const [isDarkTheme, setIsDarkTheme] = React.useState(false);
    const [, setGisLoaded] = React.useState(false);
    const { user, quotaRemaining, bucketCapacity, isGuestLoading, isGoogleLoading, setIsGoogleLoading, error, loginGuest, loginGoogle, logout, initAuth } =
        useAuthStore();

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    React.useEffect(() => {
        initAuth();
        if (typeof window !== 'undefined' && (window as unknown as { google?: any })?.google) {
            setGisLoaded(true);
        }
    }, [initAuth]);

    const renderGoogleButton = React.useCallback(
        (container: HTMLDivElement | null) => {
            if (!container) return;
            const google = (window as unknown as { google?: { accounts?: { id?: { initialize: Function; renderButton: Function } } } })?.google;
            if (!google?.accounts?.id || !googleClientId) return;

            try {
                container.innerHTML = '';
                google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: async (response: { credential?: string }) => {
                        if (response?.credential) {
                            setIsGoogleLoading(true);
                            const ok = await loginGoogle(response.credential);
                            setIsGoogleLoading(false);
                            if (ok) setDialogOpen(false);
                        }
                    }
                });

                google.accounts.id.renderButton(container, {
                    theme: 'outline',
                    size: 'large',
                    width: 270,
                    text: 'signin_with',
                    shape: 'rectangular'
                });
            } catch {
                // Graceful fallback
            }
        },
        [googleClientId, loginGoogle, setIsGoogleLoading]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPrompt('');
    };

    return (
        <div className="h-screen flex flex-col bg-[#f4f5f8] text-[#0f172a] font-sans overflow-hidden">
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGisLoaded(true)} />
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
                    {user ? (
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="User profile menu"
                                    className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-0 border-0 bg-transparent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004ea1] focus-visible:ring-offset-2"
                                >
                                    <Avatar className="h-9 w-9 border border-[#cbd5e1] shadow-xs transition-colors duration-150 group-hover:border-[#004ea1] group-hover:ring-2 group-hover:ring-[#004ea1]/25">
                                        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                                        <AvatarFallback className="bg-[#e8f3fc] text-[#004ea1] text-xs font-bold">
                                            {user.name
                                                ? user.name
                                                      .split(' ')
                                                      .map((n) => n[0])
                                                      .join('')
                                                      .slice(0, 2)
                                                      .toUpperCase()
                                                : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-80 p-4 rounded-2xl shadow-xl border-[#cbd5e1] bg-white">
                                {/* 1. Name / Email / Guest ID */}
                                <div className="flex items-center gap-3 pb-3 border-b border-[#e2e8f0]">
                                    <Avatar className="h-10 w-10 border border-[#cbd5e1] shrink-0">
                                        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                                        <AvatarFallback className="bg-[#e8f3fc] text-[#004ea1] text-sm font-bold">
                                            {user.name
                                                ? user.name
                                                      .split(' ')
                                                      .map((n) => n[0])
                                                      .join('')
                                                      .slice(0, 2)
                                                      .toUpperCase()
                                                : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-heading font-bold text-sm text-[#0f172a] truncate">{user.name}</span>
                                            <Badge variant={user.isGuest ? 'outline' : 'soft'} className="text-[10px] px-1.5 py-0 font-medium shrink-0">
                                                {user.isGuest ? 'Guest' : 'Verified'}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-[#475569] truncate" title={user.email || user.deviceId || user.id}>
                                            {user.email ? user.email : `Guest ID: ${(user.deviceId || user.id).slice(0, 12)}...`}
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Quota */}
                                <div className="py-3 border-b border-[#e2e8f0] space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-[#334155]">API Quota</span>
                                        <span className="font-bold text-[#004ea1] bg-[#e8f3fc] px-2 py-0.5 rounded-md border border-[#93c5fd]">
                                            {quotaRemaining}/{bucketCapacity} Quota
                                        </span>
                                    </div>
                                    <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-[#004ea1] h-full rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, Math.max(0, (quotaRemaining / bucketCapacity) * 100))}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#64748b]">Hourly token replenishment enabled</p>
                                </div>

                                {/* 3. Theme */}
                                <div className="py-3 border-b border-[#e2e8f0] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isDarkTheme ? (
                                            <Moon className="h-4 w-4 text-[#004ea1]" aria-hidden="true" />
                                        ) : (
                                            <Sun className="h-4 w-4 text-[#f59e0b]" aria-hidden="true" />
                                        )}
                                        <span className="text-xs font-medium text-[#334155]">Dark Mode</span>
                                    </div>
                                    <Switch
                                        checked={isDarkTheme}
                                        onCheckedChange={(checked) => {
                                            setIsDarkTheme(checked);
                                            if (typeof document !== 'undefined') {
                                                if (checked) {
                                                    document.documentElement.classList.add('dark');
                                                } else {
                                                    document.documentElement.classList.remove('dark');
                                                }
                                            }
                                        }}
                                        aria-label="Toggle dark mode theme"
                                    />
                                </div>

                                {/* 4. Sign Out */}
                                <div className="pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setPopoverOpen(false);
                                            logout();
                                        }}
                                        className="w-full justify-center gap-2 text-xs font-semibold text-[#991b1b] border-[#fca5a5] hover:bg-[#fef2f2] hover:text-[#7f1d1d] rounded-xl h-9"
                                    >
                                        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                                        <span>Sign Out</span>
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                                    {/* Google Sign In with matching rounded-xl border radius and dedicated loading state */}
                                    <div className="relative w-full">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isGoogleLoading || isGuestLoading}
                                            onClick={async () => {
                                                setIsGoogleLoading(true);
                                                const ok = await loginGoogle('mock-google-token:developer@nexusagent.internal:Lead Systems Architect');
                                                setIsGoogleLoading(false);
                                                if (ok) setDialogOpen(false);
                                            }}
                                            className="w-full justify-center gap-2 text-xs font-medium border-[#cbd5e1] hover:bg-[#f8fafc] rounded-xl h-10 shadow-xs"
                                            title="Sign in with Google"
                                        >
                                            {isGoogleLoading ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#004ea1]" aria-hidden="true" />
                                            ) : (
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
                                            )}
                                            <span>{isGoogleLoading ? 'Signing in with Google...' : 'Google Sign In'}</span>
                                        </Button>

                                        {/* Invisible Google GIS button overlay — triggers native popup on click while preserving our custom rounded-xl button */}
                                        {!isGoogleLoading && (
                                            <div
                                                ref={renderGoogleButton}
                                                className="absolute inset-0 opacity-[0.001] cursor-pointer overflow-hidden rounded-xl flex items-center justify-center z-10"
                                                title="Sign in with Google"
                                            />
                                        )}
                                    </div>

                                    {/* Guest Sign In button with dedicated isGuestLoading state */}
                                    <Button
                                        variant="secondary"
                                        disabled={isGuestLoading || isGoogleLoading}
                                        onClick={async () => {
                                            const ok = await loginGuest();
                                            if (ok) setDialogOpen(false);
                                        }}
                                        className="w-full justify-center gap-2 text-xs font-medium rounded-xl h-10"
                                    >
                                        {isGuestLoading ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                        ) : (
                                            <User className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                        <span>{isGuestLoading ? 'Creating Guest Pass...' : 'Guest Sign In'}</span>
                                    </Button>
                                    {error && <p className="text-[11px] text-[#991b1b] text-center pt-1">{error}</p>}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
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
