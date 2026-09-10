import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ObservabilityPanel } from './observability-panel';

describe('ObservabilityPanel component', () => {
    it('renders agent execution pipeline and token metrics', () => {
        render(<ObservabilityPanel />);

        expect(screen.getByText('Agent Inspector')).toBeInTheDocument();
        expect(screen.getByText('Execution Pipeline')).toBeInTheDocument();
        expect(screen.getByText('Planner Node')).toBeInTheDocument();
        expect(screen.getByText('Token Usage & Cost')).toBeInTheDocument();
        expect(screen.getByText('Execution Trace')).toBeInTheDocument();
    });

    it('renders custom token metrics and pipeline nodes', () => {
        const customNodes = [{ id: '1', name: 'planner' as const, label: 'Custom Node', status: 'completed' as const }];
        render(<ObservabilityPanel nodes={customNodes} costFormatted="$0.05000" promptTokens={5000} />);

        expect(screen.getByText('Custom Node')).toBeInTheDocument();
        expect(screen.getByText('$0.05000')).toBeInTheDocument();
        expect(screen.getByText('5,000')).toBeInTheDocument();
    });
});
