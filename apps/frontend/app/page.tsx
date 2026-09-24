'use client';

import * as React from 'react';
import Script from 'next/script';
import { Bot, Briefcase, Database, FileText, KeyRound, Loader2, LogIn, LogOut, Moon, Send, Sparkles, Sun, UploadCloud, User } from 'lucide-react';
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
import { HireMeModal } from '@/components/hire-me-modal';
import { ByokModal } from '@/components/byok-modal';
import { ObservabilityPanel, type LogEntry, type TelemetryMetrics } from '@/components/observability-panel';

interface ChatItem {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: string[];
}

interface SeededDoc {
    id: string;
    filename: string;
    total_chunks: number;
    uploaded_at?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
    const [prompt, setPrompt] = React.useState('');
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const [isDarkTheme, setIsDarkTheme] = React.useState(false);
    const [, setGisLoaded] = React.useState(false);
    const [hireMeModalOpen, setHireMeModalOpen] = React.useState(false);
    const [byokModalOpen, setByokModalOpen] = React.useState(false);
    const [seededDocs, setSeededDocs] = React.useState<SeededDoc[]>([]);
    const [isStreaming, setIsStreaming] = React.useState(false);
    const [messages, setMessages] = React.useState<ChatItem[]>([]);

    const [metrics, setMetrics] = React.useState<TelemetryMetrics>({
        activeModel: 'gemini-2.5-flash',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs: 0,
        rpmRemaining: 15,
        isByok: false
    });

    const [logs, setLogs] = React.useState<LogEntry[]>([
        {
            id: 'init-1',
            timestamp: new Date().toLocaleTimeString(),
            stage: 'ROUTER',
            message: 'Initialized model cascade gateway: gemini-2.5-flash primary (15 RPM ceiling)'
        },
        {
            id: 'init-2',
            timestamp: new Date().toLocaleTimeString(),
            stage: 'RAG',
            message: 'Connected Neon pgvector index (benchlm, openrouter, cursorbench)'
        }
    ]);

    const {
        user,
        token,
        quotaRemaining,
        bucketCapacity,
        isGuestLoading,
        isGoogleLoading,
        setIsGoogleLoading,
        error,
        byokKey,
        byokProvider,
        loginGuest,
        loginGoogle,
        logout,
        initAuth,
        setQuotaRemaining
    } = useAuthStore();

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    React.useEffect(() => {
        initAuth();
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('nexusagent_theme');
            const systemDark = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
            const isDark = storedTheme ? storedTheme === 'dark' : systemDark;
            setIsDarkTheme(isDark);
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            if ((window as unknown as { google?: any })?.google) {
                setGisLoaded(true);
            }
        }
    }, [initAuth]);

    // Fetch seeded benchmark documents on mount
    React.useEffect(() => {
        async function fetchDocs() {
            try {
                const res = await fetch(`${API_BASE}/api/chat/documents`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.documents) {
                        setSeededDocs(data.documents);
                    }
                }
            } catch {
                // Fallback docs
                setSeededDocs([
                    { id: '1', filename: 'benchlm_evals.md', total_chunks: 5 },
                    { id: '2', filename: 'cursor_bench.md', total_chunks: 4 },
                    { id: '3', filename: 'openrouter_metrics.md', total_chunks: 5 },
                    { id: '4', filename: 'leaks_rumours.md', total_chunks: 11 },
                    { id: '5', filename: 'artificial_analysis.md', total_chunks: 4 }
                ]);
            }
        }
        fetchDocs();
    }, []);

    const gsiInitializedRef = React.useRef(false);
    const handleCredentialRef = React.useRef<((credential: string) => Promise<void>) | null>(null);

    handleCredentialRef.current = async (credential: string) => {
        setIsGoogleLoading(true);
        const ok = await loginGoogle(credential);
        setIsGoogleLoading(false);
        if (ok) setDialogOpen(false);
    };

    const initGsi = React.useCallback(() => {
        if (gsiInitializedRef.current || !googleClientId) return;
        const google = (window as unknown as { google?: { accounts?: { id?: { initialize: Function; renderButton: Function } } } })?.google;
        if (!google?.accounts?.id) return;

        try {
            google.accounts.id.initialize({
                client_id: googleClientId,
                callback: (response: { credential?: string }) => {
                    if (response?.credential && handleCredentialRef.current) {
                        void handleCredentialRef.current(response.credential);
                    }
                }
            });
            gsiInitializedRef.current = true;
        } catch {
            // Graceful fallback
        }
    }, [googleClientId]);

    const renderGoogleButton = React.useCallback(
        (container: HTMLDivElement | null) => {
            if (!container || !googleClientId) return;
            const google = (window as unknown as { google?: { accounts?: { id?: { initialize: Function; renderButton: Function } } } })?.google;
            if (!google?.accounts?.id) return;

            initGsi();

            try {
                container.innerHTML = '';
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
        [googleClientId, initGsi]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = prompt.trim();
        if (!query || isStreaming) return;

        // Check if demo quota is exhausted and not BYOK
        if (!byokKey && quotaRemaining <= 0) {
            setHireMeModalOpen(true);
            return;
        }

        const userMsgId = `u-${Date.now()}`;
        const assistantMsgId = `a-${Date.now()}`;

        setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: query }, { id: assistantMsgId, role: 'assistant', content: '' }]);
        setPrompt('');
        setIsStreaming(true);

        const addLog = (stage: LogEntry['stage'], message: string) => {
            setLogs((prev) => [
                ...prev,
                {
                    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    timestamp: new Date().toLocaleTimeString(),
                    stage,
                    message
                }
            ]);
        };

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            if (byokKey) {
                headers['X-User-API-Key'] = byokKey;
                headers['X-User-Provider'] = byokProvider;
            }

            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: query,
                    byok_key: byokKey || undefined,
                    byok_provider: byokProvider
                })
            });

            if (res.status === 429) {
                const errJson = await res.json().catch(() => null);
                const detail = errJson?.detail || 'Demo rate limit reached. Bring your own key or contact for custom build.';
                setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: `⚠️ ${detail}` } : m)));
                addLog('ROUTER', '429 RateLimitExceeded: Free-tier bucket exhausted.');
                setIsStreaming(false);
                return;
            }

            if (!res.ok || !res.body) {
                throw new Error(`Chat error (${res.statusText})`);
            }

            // Decrement remaining quota if not BYOK
            if (!byokKey && quotaRemaining > 0) {
                setQuotaRemaining(quotaRemaining - 1);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const textChunk = decoder.decode(value, { stream: true });
                const lines = textChunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.stage === 'ROUTER') {
                                addLog('ROUTER', data.message);
                                setMetrics((m) => ({ ...m, activeModel: data.model, isByok: Boolean(data.isByok) }));
                            } else if (data.stage === 'RAG') {
                                addLog('RAG', data.message);
                            } else if (data.stage === 'INFERENCE') {
                                addLog('INFERENCE', data.message);
                            } else if (data.stage === 'STREAM' && data.token) {
                                accumulatedText += data.token;
                                setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulatedText } : m)));
                            } else if (data.stage === 'METRICS') {
                                setMetrics((m) => ({
                                    ...m,
                                    promptTokens: data.promptTokens,
                                    completionTokens: data.completionTokens,
                                    totalTokens: data.totalTokens,
                                    latencyMs: data.latencyMs,
                                    activeModel: data.activeModel,
                                    isByok: data.isByok
                                }));
                                addLog('STREAM', `Completed: ${data.totalTokens} tokens burned in ${data.latencyMs}ms (${data.activeModel})`);
                            }
                        } catch {
                            // Non-JSON line or keep-alive
                        }
                    }
                }
            }
        } catch (err: any) {
            const errorText = err?.message || 'Failed to connect to inference stream.';
            setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: `Error: ${errorText}` } : m)));
            addLog('STREAM', `Error: ${errorText}`);
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background text-foreground font-sans overflow-hidden">
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGisLoaded(true)} />

            {/* 1. Header */}
            <header
                role="banner"
                aria-label="Command Center Navigation"
                className="h-14 bg-card border-b border-border px-4 md:px-6 flex items-center justify-between shrink-0 z-30"
            >
                <div className="flex items-center gap-3">
                    <NexusLogo className="h-8 w-8 rounded-xl shadow-xs shrink-0" aria-hidden="true" />
                    <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm tracking-tight text-foreground">NexusAgent</span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* BYOK CTA Button */}
                    <Button
                        variant={byokKey ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setByokModalOpen(true)}
                        className={`text-xs font-semibold gap-1.5 rounded-xl border-border h-9 ${
                            byokKey ? 'bg-primary text-primary-foreground shadow-xs' : 'hover:bg-secondary'
                        }`}
                        title="Bring Your Own API Key"
                    >
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>{byokKey ? 'BYOK Active' : 'Bring Your Own Key'}</span>
                    </Button>

                    {user ? (
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="User profile menu"
                                    className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-0 border-0 bg-transparent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <Avatar className="h-9 w-9 border border-border shadow-xs transition-colors duration-150 group-hover:border-primary group-hover:ring-2 group-hover:ring-primary/25">
                                        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
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
                            <PopoverContent align="end" className="w-80 p-4 rounded-2xl shadow-xl border-border bg-popover text-popover-foreground">
                                {/* User Info */}
                                <div className="flex items-center gap-3 pb-3 border-b border-border">
                                    <Avatar className="h-10 w-10 border border-border shrink-0">
                                        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                                        <AvatarFallback className="bg-accent text-accent-foreground text-sm font-bold">
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
                                            <span className="font-heading font-bold text-sm text-foreground truncate">{user.name}</span>
                                            <Badge variant={user.isGuest ? 'outline' : 'soft'} className="text-[10px] px-1.5 py-0 font-medium shrink-0">
                                                {user.isGuest ? 'Guest' : 'Verified'}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground truncate" title={user.email || user.deviceId || user.id}>
                                            {user.email ? user.email : `Guest ID: ${(user.deviceId || user.id).slice(0, 12)}...`}
                                        </span>
                                    </div>
                                </div>

                                {/* Quota Section */}
                                <div className="py-3 border-b border-border space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-muted-foreground">API Quota</span>
                                        <span className="font-bold text-primary bg-accent px-2 py-0.5 rounded-md border border-border">
                                            {quotaRemaining}/{bucketCapacity} Quota
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-primary h-full rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, Math.max(0, (quotaRemaining / bucketCapacity) * 100))}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Hourly token replenishment enabled</p>
                                </div>

                                {/* Theme Switch */}
                                <div className="py-3 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isDarkTheme ? (
                                            <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
                                        ) : (
                                            <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
                                        )}
                                        <span className="text-xs font-medium text-foreground">Dark Mode</span>
                                    </div>
                                    <Switch
                                        checked={isDarkTheme}
                                        onCheckedChange={(checked) => {
                                            setIsDarkTheme(checked);
                                            if (typeof document !== 'undefined') {
                                                if (checked) {
                                                    document.documentElement.classList.add('dark');
                                                    localStorage.setItem('nexusagent_theme', 'dark');
                                                } else {
                                                    document.documentElement.classList.remove('dark');
                                                    localStorage.setItem('nexusagent_theme', 'light');
                                                }
                                            }
                                        }}
                                        aria-label="Toggle dark mode theme"
                                    />
                                </div>

                                {/* Sign Out */}
                                <div className="pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setPopoverOpen(false);
                                            logout();
                                        }}
                                        className="w-full justify-center gap-2 text-xs font-semibold text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive rounded-xl h-9"
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
                                    {/* Google Sign In */}
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
                                            className="w-full justify-center gap-2 text-xs font-medium border-border hover:bg-secondary rounded-xl h-10 shadow-xs"
                                            title="Sign in with Google"
                                        >
                                            {isGoogleLoading ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
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

                                        {!isGoogleLoading && (
                                            <div
                                                ref={renderGoogleButton}
                                                className="absolute inset-0 opacity-[0.001] cursor-pointer overflow-hidden rounded-xl flex items-center justify-center z-10"
                                                title="Sign in with Google"
                                            />
                                        )}
                                    </div>

                                    {/* Guest Sign In */}
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
                                    {error && <p className="text-[11px] text-destructive text-center pt-1">{error}</p>}
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
                    className="w-72 lg:w-80 bg-card border-r border-border flex flex-col shrink-0 overflow-y-auto p-4 space-y-4"
                >
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                        <h2 className="flex items-center gap-1.5 text-xs font-heading font-bold text-foreground">
                            <Database className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                            <span>Workspace &amp; Tools</span>
                        </h2>
                    </div>

                    {/* Document Vault with Seeded Documents */}
                    <Card className="shadow-2xs border-border">
                        <CardHeader className="p-3 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-heading">Document Vault</CardTitle>
                                <Badge variant="soft" className="text-[10px] font-mono">
                                    {seededDocs.length} Seeded
                                </Badge>
                            </div>
                            <CardDescription className="text-xs text-muted-foreground">Pre-indexed AI benchmarks (Neon pgvector)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                                {seededDocs.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/70 text-[11px]"
                                    >
                                        <div className="flex items-center gap-1.5 truncate">
                                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span className="truncate font-mono text-foreground">{doc.filename}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                                            {doc.total_chunks} chunks
                                        </Badge>
                                    </div>
                                ))}
                            </div>

                            {/* Lead Magnet CTA: Upload Custom Data */}
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setHireMeModalOpen(true)}
                                className="w-full justify-center gap-1.5 text-xs font-bold rounded-xl mt-2 shadow-2xs h-9"
                            >
                                <UploadCloud className="h-3.5 w-3.5" />
                                <span>Upload Custom Data</span>
                            </Button>
                            <p className="text-[10px] text-muted-foreground text-center">
                                Bi-weekly benchmark index. Click upload to inquire for custom pipeline build.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-2xs border-border">
                        <CardHeader className="p-3 pb-2">
                            <CardTitle className="text-xs font-heading">Tool Registry</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">MCP v2 server tools &amp; execution</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <p className="text-xs text-muted-foreground">MCP tool controls and sandbox policies configure in Phase 4 &amp; 5.</p>
                        </CardContent>
                    </Card>
                </aside>

                {/* 3. Synthesis Canvas (Center) */}
                <main role="main" aria-label="Active Synthesis Canvas" className="flex-1 flex flex-col overflow-hidden bg-background">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-2.5 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-foreground">Synthesis Canvas</span>
                                <Badge variant="soft">Ready</Badge>
                            </div>
                            {byokKey && (
                                <Badge variant="outline" className="text-[10px] text-primary border-primary/40 font-mono">
                                    BYOK: {byokProvider.toUpperCase()}
                                </Badge>
                            )}
                        </div>

                        {/* Quota Depleted Lead Magnet Alert */}
                        {!byokKey && quotaRemaining <= 0 && (
                            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                <div>
                                    <p className="font-bold text-foreground">Demo Token Quota Reached</p>
                                    <p className="text-muted-foreground text-[11px] mt-0.5">
                                        Use your own API key to continue querying without limits, or book a custom architecture build.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setByokModalOpen(true)}
                                        className="text-xs font-semibold rounded-xl h-8 gap-1"
                                    >
                                        <KeyRound className="h-3.5 w-3.5" />
                                        <span>Use My Key</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => setHireMeModalOpen(true)}
                                        className="text-xs font-bold rounded-xl h-8 gap-1"
                                    >
                                        <Briefcase className="h-3.5 w-3.5" />
                                        <span>Hire Me</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Messages Thread */}
                        {messages.length === 0 ? (
                            <Card className="shadow-xs border-border">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        Autonomous Systems Intelligence
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        RAG-augmented reasoning against weekly AI model benchmarks (BenchLM, OpenRouter, CursorBench).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-3">
                                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border text-xs text-muted-foreground leading-relaxed">
                                        Ask benchmark comparisons, context lengths, token costs, or agentic coding leaderboard rankings.
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {[
                                            'How does Claude Sonnet 5 compare on CursorBench at High effort?',
                                            'What are the leaked specs for Grok 4.7 and Gemini 4?',
                                            'Compare OpenRouter pricing & throughput for DeepSeek V4.1 Flash vs Gemini 3.8'
                                        ].map((promptText) => (
                                            <button
                                                key={promptText}
                                                type="button"
                                                onClick={() => setPrompt(promptText)}
                                                className="text-[11px] px-3 py-1.5 rounded-lg border border-border/80 bg-card hover:bg-secondary text-foreground text-left transition-colors cursor-pointer"
                                            >
                                                &ldquo;{promptText}&rdquo;
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex gap-3 text-xs leading-relaxed ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                                <Bot className="h-4 w-4" />
                                            </div>
                                        )}
                                        <div
                                            className={`p-3.5 rounded-2xl max-w-2xl whitespace-pre-wrap ${
                                                msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground font-medium rounded-tr-xs'
                                                    : 'bg-card border border-border text-foreground shadow-2xs rounded-tl-xs'
                                            }`}
                                        >
                                            {msg.content || (
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    <span>Synthesizing response...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Input Form */}
                    <form onSubmit={handleSubmit} role="search" aria-label="Architecture inquiry input" className="p-4 bg-card border-t border-border shrink-0">
                        <div className="relative flex items-center">
                            <Input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ask architectural question or query benchmark knowledge base..."
                                disabled={isStreaming}
                                className="pr-24 min-h-[44px] text-xs rounded-xl bg-secondary/40 border-border text-foreground focus-visible:bg-card"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                variant="default"
                                disabled={isStreaming || !prompt.trim()}
                                aria-label="Send query"
                                className="absolute right-1.5 h-8 px-4 text-xs rounded-lg gap-1.5 font-bold"
                            >
                                {isStreaming ? (
                                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                ) : (
                                    <>
                                        <span>Send</span>
                                        <Send className="h-3 w-3" aria-hidden="true" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </main>

                {/* 4. Observability Panel (Right) */}
                <ObservabilityPanel metrics={metrics} logs={logs} />
            </div>

            {/* Modals */}
            <HireMeModal open={hireMeModalOpen} onOpenChange={setHireMeModalOpen} />
            <ByokModal open={byokModalOpen} onOpenChange={setByokModalOpen} />
        </div>
    );
}
