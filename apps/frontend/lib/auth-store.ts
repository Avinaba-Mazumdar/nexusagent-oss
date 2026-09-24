import { create } from 'zustand';
import type { UserSession, GuestPassResponse } from '@nexusagent/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const STORAGE_KEY_TOKEN = 'nexusagent_token';
const STORAGE_KEY_USER = 'nexusagent_user';
const STORAGE_KEY_QUOTA = 'nexusagent_quota';
const STORAGE_KEY_DEVICE_ID = 'nexusagent_device_id';
const STORAGE_KEY_BYOK_KEY = 'nexusagent_byok_key';
const STORAGE_KEY_BYOK_PROVIDER = 'nexusagent_byok_provider';

export type ByokProvider = 'google' | 'openrouter';

function getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return '';
    try {
        let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
        if (!deviceId) {
            deviceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 18);
            localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
        }
        return deviceId;
    } catch {
        return '';
    }
}

interface AuthState {
    user: UserSession | null;
    token: string | null;
    quotaRemaining: number;
    bucketCapacity: number;
    isLoading: boolean;
    isGuestLoading: boolean;
    isGoogleLoading: boolean;
    error: string | null;
    byokKey: string | null;
    byokProvider: ByokProvider;
    setIsGoogleLoading: (loading: boolean) => void;
    loginGuest: () => Promise<boolean>;
    loginGoogle: (credential: string) => Promise<boolean>;
    logout: () => void;
    setByokKey: (key: string | null, provider?: ByokProvider) => void;
    clearByokKey: () => void;
    setQuotaRemaining: (quota: number) => void;
    initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    quotaRemaining: 5,
    bucketCapacity: 5,
    isLoading: false,
    isGuestLoading: false,
    isGoogleLoading: false,
    error: null,
    byokKey: null,
    byokProvider: 'google',

    setIsGoogleLoading: (isGoogleLoading: boolean) => set({ isGoogleLoading }),
    setQuotaRemaining: (quotaRemaining: number) => set({ quotaRemaining }),

    setByokKey: (key: string | null, provider: ByokProvider = 'google') => {
        if (typeof window !== 'undefined') {
            if (key) {
                localStorage.setItem(STORAGE_KEY_BYOK_KEY, key);
                localStorage.setItem(STORAGE_KEY_BYOK_PROVIDER, provider);
            } else {
                localStorage.removeItem(STORAGE_KEY_BYOK_KEY);
                localStorage.removeItem(STORAGE_KEY_BYOK_PROVIDER);
            }
        }
        set({ byokKey: key, byokProvider: provider });
    },

    clearByokKey: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY_BYOK_KEY);
            localStorage.removeItem(STORAGE_KEY_BYOK_PROVIDER);
        }
        set({ byokKey: null, byokProvider: 'google' });
    },

    initAuth: async () => {
        if (typeof window === 'undefined') return;
        try {
            const token = localStorage.getItem(STORAGE_KEY_TOKEN);
            const userStr = localStorage.getItem(STORAGE_KEY_USER);
            const quota = localStorage.getItem(STORAGE_KEY_QUOTA);
            const byokKey = localStorage.getItem(STORAGE_KEY_BYOK_KEY);
            const byokProvider = (localStorage.getItem(STORAGE_KEY_BYOK_PROVIDER) as ByokProvider) || 'google';

            if (byokKey) {
                set({ byokKey, byokProvider });
            }

            if (!token || !userStr) {
                return;
            }

            const user = JSON.parse(userStr) as UserSession;
            set({
                token,
                user,
                quotaRemaining: quota ? parseInt(quota, 10) : 5
            });

            // Server-side session validation against Neon PostgreSQL
            try {
                const res = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    const validatedUser = data.user;
                    const validatedQuota = data.quota?.tokensRemaining ?? 5;
                    const validatedCapacity = data.quota?.bucketCapacity ?? 5;

                    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(validatedUser));
                    localStorage.setItem(STORAGE_KEY_QUOTA, validatedQuota.toString());

                    set({
                        user: validatedUser,
                        quotaRemaining: validatedQuota,
                        bucketCapacity: validatedCapacity
                    });
                } else if (res.status === 401 || res.status === 403 || res.status === 404) {
                    // Stale session: record deleted from database or token revoked
                    useAuthStore.getState().logout();
                }
            } catch {
                // Network unreachable; retain cached session for offline resilience
            }
        } catch {
            // Storage access failed or JSON invalid, fallback to logged out
            useAuthStore.getState().logout();
        }
    },

    loginGuest: async () => {
        set({ isGuestLoading: true, isLoading: true, error: null });
        try {
            const deviceId = getOrCreateDeviceId();
            const res = await fetch(`${API_BASE}/api/auth/guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: deviceId || undefined })
            });

            if (!res.ok) {
                throw new Error(`Failed to create guest pass: ${res.statusText}`);
            }

            const data: GuestPassResponse = await res.json();
            const token = data.tokens.accessToken;
            const user = data.user;
            const quotaRemaining = data.quotaRemaining;
            const bucketCapacity = data.bucketCapacity;

            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_TOKEN, token);
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
                localStorage.setItem(STORAGE_KEY_QUOTA, quotaRemaining.toString());
            }

            set({
                token,
                user,
                quotaRemaining,
                bucketCapacity,
                isGuestLoading: false,
                isLoading: false,
                error: null
            });
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error during guest sign-in';
            set({ isGuestLoading: false, isLoading: false, error: message });
            return false;
        }
    },

    loginGoogle: async (credential: string) => {
        set({ isGoogleLoading: true, isLoading: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.detail || `Failed Google authentication: ${res.statusText}`);
            }

            const data = await res.json();
            const token = data.accessToken;
            const user = data.user;
            const quotaRemaining = 25;
            const bucketCapacity = 25;

            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_TOKEN, token);
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
                localStorage.setItem(STORAGE_KEY_QUOTA, quotaRemaining.toString());
            }

            set({
                token,
                user,
                quotaRemaining,
                bucketCapacity,
                isGoogleLoading: false,
                isLoading: false,
                error: null
            });
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error during Google sign-in';
            set({ isGoogleLoading: false, isLoading: false, error: message });
            return false;
        }
    },

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY_TOKEN);
            localStorage.removeItem(STORAGE_KEY_USER);
            localStorage.removeItem(STORAGE_KEY_QUOTA);
        }
        set({
            user: null,
            token: null,
            quotaRemaining: 5,
            bucketCapacity: 5,
            isGuestLoading: false,
            isGoogleLoading: false,
            isLoading: false,
            error: null
        });
    }
}));
