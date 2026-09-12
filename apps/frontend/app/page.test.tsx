import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Home Page - 4 Element Layout', () => {
    it('renders the 4 primary layout elements: Header, Workspace, Canvas, and Observability', () => {
        render(<Home />);

        // 1. Header
        expect(screen.getByRole('banner', { name: /command center navigation/i })).toBeInTheDocument();
        expect(screen.getByText('NexusAgent')).toBeInTheDocument();
        expect(screen.getByText('v0.1.0')).toBeInTheDocument();

        // 2. Workspace Panel (Zone 1)
        expect(screen.getByRole('complementary', { name: /workspace & tools/i })).toBeInTheDocument();
        expect(screen.getByText('Zone 1')).toBeInTheDocument();

        // 3. Synthesis Canvas (Zone 2)
        expect(screen.getByRole('main', { name: /active synthesis canvas/i })).toBeInTheDocument();
        expect(screen.getByText('Zone 2')).toBeInTheDocument();

        // 4. Observability Panel (Zone 3)
        expect(screen.getByRole('complementary', { name: /agent telemetry & observability/i })).toBeInTheDocument();
        expect(screen.getByText('Zone 3')).toBeInTheDocument();
    });
});
