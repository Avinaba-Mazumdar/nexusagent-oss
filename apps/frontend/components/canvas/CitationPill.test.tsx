import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CitationPill } from './CitationPill';
import type { Citation } from '@nexusagent/contracts';

describe('CitationPill Component', () => {
    const mockCitation: Citation = {
        id: 'cite-1',
        chunkId: 'chk-1',
        documentId: 'doc-1',
        filename: 'RFC-104-Raft.md',
        startLine: 120,
        endLine: 145,
        headerPath: ['Consensus', 'Leader Election'],
        preview: 'In Raft, leader election is initiated when a follower election timeout elapses.'
    };

    it('renders filename and line range badge', () => {
        render(<CitationPill citation={mockCitation} />);

        expect(screen.getByText('RFC-104-Raft.md')).toBeInTheDocument();
        expect(screen.getByText('L120-145')).toBeInTheDocument();
    });

    it('renders single line notation when startLine equals endLine', () => {
        render(<CitationPill filename="benchmark.md" startLine={42} endLine={42} />);

        expect(screen.getByText('benchmark.md')).toBeInTheDocument();
        expect(screen.getByText('L42')).toBeInTheDocument();
    });

    it('calls onClick handler with citation metadata when clicked', () => {
        const handleClick = vi.fn();
        render(<CitationPill citation={mockCitation} onClick={handleClick} />);

        const pill = screen.getByTestId('citation-pill');
        fireEvent.click(pill);

        expect(handleClick).toHaveBeenCalledTimes(1);
        expect(handleClick).toHaveBeenCalledWith({
            filename: 'RFC-104-Raft.md',
            startLine: 120,
            endLine: 145
        });
    });
});
