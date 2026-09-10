import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './header';

describe('Header component', () => {
    it('renders branding and version indicator', () => {
        render(<Header version="Archon v0.1.0" />);
        expect(screen.getByText('NexusAgent')).toBeInTheDocument();
        expect(screen.getByText('Archon v0.1.0')).toBeInTheDocument();
    });

    it('triggers guest pass callback when button is clicked', async () => {
        const user = userEvent.setup();
        const handleGuestLogin = vi.fn();
        render(<Header onGuestLogin={handleGuestLogin} />);

        const button = screen.getByRole('button', { name: /guest pass/i });
        await user.click(button);
        expect(handleGuestLogin).toHaveBeenCalledTimes(1);
    });

    it('renders topology dialog trigger button', () => {
        render(<Header />);
        expect(screen.getByRole('button', { name: /topology/i })).toBeInTheDocument();
    });
});
