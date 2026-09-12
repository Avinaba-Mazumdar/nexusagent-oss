import { useAuthStore } from './auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = useAuthStore.getState().token;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        if (response.status === 401) {
            useAuthStore.getState().logout();
        }
        const errorText = await response.text();
        throw new Error(errorText || `API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
}
