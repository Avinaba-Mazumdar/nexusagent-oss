import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SynthesisCanvas } from './synthesis-canvas';

describe('SynthesisCanvas component', () => {
    it('renders cluster status, user prompt, and verdict card', () => {
        render(
            <TooltipProvider>
                <SynthesisCanvas inputPrompt="" onInputPromptChange={vi.fn()} onSubmitPrompt={vi.fn()} />
            </TooltipProvider>
        );

        expect(screen.getByText('Active Cluster:')).toBeInTheDocument();
        expect(screen.getByText('Raft 3-Node Quorum')).toBeInTheDocument();
        expect(screen.getByText('NexusAgent Systems Verdict')).toBeInTheDocument();
        expect(screen.getByText(/Verdict: Quorum Invariants Verified Safe/i)).toBeInTheDocument();
    });

    it('handles input changes and prompt submissions', async () => {
        const user = userEvent.setup();
        const handlePromptChange = vi.fn();
        const handleSubmit = vi.fn((e) => e.preventDefault());

        render(
            <TooltipProvider>
                <SynthesisCanvas inputPrompt="test query" onInputPromptChange={handlePromptChange} onSubmitPrompt={handleSubmit} />
            </TooltipProvider>
        );

        const input = screen.getByRole('textbox', { name: /ask architectural question/i });
        expect(input).toHaveValue('test query');

        const sendButton = screen.getByRole('button', { name: /send architectural question/i });
        await user.click(sendButton);
        expect(handleSubmit).toHaveBeenCalled();
    });
});
