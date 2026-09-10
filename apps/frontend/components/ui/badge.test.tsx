import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge component', () => {
    it('renders as a span element to preserve hydration invariants', () => {
        render(<Badge>Test Badge</Badge>);
        const badge = screen.getByText('Test Badge');
        expect(badge).toBeInTheDocument();
        expect(badge.tagName.toLowerCase()).toBe('span');
    });

    it('applies variant classes correctly', () => {
        const { rerender } = render(<Badge variant="soft">Soft Badge</Badge>);
        const badge = screen.getByText('Soft Badge');
        expect(badge).toHaveClass('bg-[#e8f3fc]');

        rerender(<Badge variant="citation">RFC-104:L128</Badge>);
        const citationBadge = screen.getByText('RFC-104:L128');
        expect(citationBadge).toHaveClass('border-[#93c5fd]');
        expect(citationBadge).toHaveClass('font-mono');
    });
});
