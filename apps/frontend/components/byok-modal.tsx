'use client';

import * as React from 'react';
import { Check, Eye, EyeOff, KeyRound, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, type ByokProvider } from '@/lib/auth-store';

interface ByokModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ByokModal({ trigger, open, onOpenChange }: ByokModalProps) {
    const { byokKey, byokProvider, setByokKey, clearByokKey } = useAuthStore();
    const [provider, setProvider] = React.useState<ByokProvider>(byokProvider || 'google');
    const [inputValue, setInputValue] = React.useState('');
    const [showKey, setShowKey] = React.useState(false);
    const [savedSuccess, setSavedSuccess] = React.useState(false);

    React.useEffect(() => {
        if (byokProvider) setProvider(byokProvider);
        if (byokKey) setInputValue(byokKey);
    }, [byokKey, byokProvider, open]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed) {
            clearByokKey();
        } else {
            setByokKey(trimmed, provider);
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 2000);
        }
        if (onOpenChange) {
            setTimeout(() => onOpenChange(false), 400);
        }
    };

    const handleClear = () => {
        clearByokKey();
        setInputValue('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border bg-card rounded-2xl shadow-2xl">
                <div className="p-6 pb-4 bg-gradient-to-br from-secondary/60 to-transparent border-b border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="soft" className="gap-1 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                            <KeyRound className="h-3 w-3 text-primary" />
                            Unconstrained Inferences
                        </Badge>
                    </div>
                    <DialogTitle className="text-xl font-heading font-extrabold tracking-tight text-foreground">Bring Your Own Key (BYOK)</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Bypass demo token-bucket rate limits and run queries directly using your personal API key.
                    </DialogDescription>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                    {/* Provider Toggle */}
                    <div className="space-y-1.5">
                        <label className="font-semibold text-foreground">LLM Provider</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setProvider('google')}
                                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                                    provider === 'google'
                                        ? 'bg-primary/10 border-primary text-primary font-bold'
                                        : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary'
                                }`}
                            >
                                <span>Google AI Studio</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setProvider('openrouter')}
                                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                                    provider === 'openrouter'
                                        ? 'bg-primary/10 border-primary text-primary font-bold'
                                        : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary'
                                }`}
                            >
                                <span>OpenRouter</span>
                            </button>
                        </div>
                    </div>

                    {/* Key Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="byok-input" className="font-semibold text-foreground">
                                {provider === 'google' ? 'Google Gemini API Key' : 'OpenRouter API Key'}
                            </label>
                            {byokKey && (
                                <Badge variant="outline" className="text-[10px] text-primary border-primary/40">
                                    Active Key Configured
                                </Badge>
                            )}
                        </div>
                        <div className="relative flex items-center">
                            <Input
                                id="byok-input"
                                type={showKey ? 'text' : 'password'}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={provider === 'google' ? 'AIzaSy...' : 'sk-or-v1-...'}
                                className="pr-10 rounded-xl bg-secondary/30 text-xs font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                aria-label={showKey ? 'Hide key' : 'Show key'}
                            >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="rounded-xl border border-border bg-secondary/30 p-3 flex items-start gap-2.5 text-[11px] text-muted-foreground">
                        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                            Your key is stored strictly in your browser&apos;s <strong>localStorage</strong>. It is passed via HTTPS headers directly to the
                            inference endpoint and is never persisted to databases or telemetry logs.
                        </span>
                    </div>

                    {/* Buttons */}
                    <div className="pt-2 flex items-center gap-2">
                        {byokKey && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClear}
                                className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 rounded-xl"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remove</span>
                            </Button>
                        )}
                        <Button type="submit" variant="default" className="flex-1 justify-center gap-1.5 text-xs font-bold rounded-xl h-10">
                            {savedSuccess ? (
                                <>
                                    <Check className="h-4 w-4 text-emerald-400" />
                                    <span>Key Saved</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>{byokKey ? 'Update Key' : 'Save &amp; Activate'}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
