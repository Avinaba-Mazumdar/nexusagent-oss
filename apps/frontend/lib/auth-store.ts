import { create } from 'zustand';
import type { UserSession, GuestPassResponse } from '@nexusagent/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const STORAGE_KEY_TOKEN = 'nexusagent_token';
const STORAGE_KEY_USER = 'nexusagent_user';
const STORAGE_KEY_QUOTA = 'nexusagent_quota';
const STORAGE_KEY_DEVICE_ID = 'nexusagent_device_id';

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
    error: string | null;
    loginGuest: () => Promise<boolean>;
    logout: () => void;
    initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    quotaRemaining: 5,
    bucketCapacity: 5,
    isLoading: false,
    error: null,

    initAuth: () => {
        if (typeof window === 'undefined') return;
        try {
            const token = localStorage.getItem(STORAGE_KEY_TOKEN);
            const userStr = localStorage.getItem(STORAGE_KEY_USER);
            const quota = localStorage.getItem(STORAGE_KEY_QUOTA);

            if (token && userStr) {
                const user = JSON.parse(userStr) as UserSession;
                set({
                    token,
                    user,
                    quotaRemaining: quota ? parseInt(quota, 10) : 5
                });
            }
        } catch {
            // Storage access failed or JSON invalid, fallback to empty
            localStorage.removeItem(STORAGE_KEY_TOKEN);
            localStorage.removeItem(STORAGE_KEY_USER);
            localStorage.removeItem(STORAGE_KEY_QUOTA);
        }
    },

    loginGuest: async () => {
        set({ isLoading: true, error: null });
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
                isLoading: false,
                error: null
            });
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error during guest sign-in';
            set({ isLoading: false, error: message });
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
            error: null
        });
    }
}));
