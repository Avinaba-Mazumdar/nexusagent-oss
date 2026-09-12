import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

describe('Home Page - Layout and Header Controls', () => {
    it('renders the 4 primary layout elements without versions, quotas, or zone tags', () => {
        render(<Home />);

        // 1. Header
        expect(screen.getByRole('banner', { name: /command center navigation/i })).toBeInTheDocument();
        expect(screen.getByText('NexusAgent')).toBeInTheDocument();
        expect(screen.queryByText('v0.1.0')).not.toBeInTheDocument();
        expect(screen.queryByText(/quota/i)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

        // 2. Workspace Panel
        expect(screen.getByRole('complementary', { name: /workspace & tools/i })).toBeInTheDocument();
        expect(screen.queryByText('Zone 1')).not.toBeInTheDocument();

        // 3. Synthesis Canvas
        expect(screen.getByRole('main', { name: /active synthesis canvas/i })).toBeInTheDocument();
        expect(screen.queryByText('Zone 2')).not.toBeInTheDocument();

        // 4. Observability Panel
        expect(screen.getByRole('complementary', { name: /agent telemetry & observability/i })).toBeInTheDocument();
        expect(screen.queryByText('Zone 3')).not.toBeInTheDocument();
    });

    it('opens sign in dialog with google and guest sign in options when clicking sign in', async () => {
        const user = userEvent.setup();
        render(<Home />);

        const signInButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(signInButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /google sign in/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /guest sign in/i })).toBeInTheDocument();
    });

    it('authenticates guest, displays session header with quota, and signs out', async () => {
        const mockGuestResponse = {
            user: {
                id: '11111111-1111-1111-1111-111111111111',
                email: null,
                name: 'Guest Architect #111111',
                avatarUrl: null,
                isGuest: true,
                createdAt: '2026-09-13T00:00:00Z',
                lastSeenAt: '2026-09-13T00:00:00Z'
            },
            tokens: {
                accessToken: 'mock.jwt.token',
                tokenType: 'bearer',
                expiresIn: 86400
            },
            quotaRemaining: 5,
            bucketCapacity: 5
        };

        const originalFetch = global.fetch;
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockGuestResponse
        } as unknown as Response);

        const user = userEvent.setup();
        render(<Home />);

        // Open Dialog
        const signInButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(signInButton);

        // Click Guest Sign In
        const guestButton = screen.getByRole('button', { name: /guest sign in/i });
        await user.click(guestButton);

        // Header shows user name and quota
        expect(await screen.findByText('Guest Architect #111111')).toBeInTheDocument();
        expect(screen.getByText('5/5 Quota')).toBeInTheDocument();

        // Sign out restores Sign In button
        const signOutButton = screen.getByRole('button', { name: /sign out/i });
        await user.click(signOutButton);

        expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.queryByText('Guest Architect #111111')).not.toBeInTheDocument();

        global.fetch = originalFetch;
    });
});
