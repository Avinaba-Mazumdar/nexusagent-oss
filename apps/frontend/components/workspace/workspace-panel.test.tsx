import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspacePanel } from './workspace-panel';

describe('WorkspacePanel component', () => {
    it('renders document vault and mcp endpoint info', () => {
        render(
            <WorkspacePanel
                ragActive={true}
                onRagChange={vi.fn()}
                sandboxActive={true}
                onSandboxChange={vi.fn()}
                sqlAuditActive={false}
                onSqlAuditChange={vi.fn()}
            />
        );

        expect(screen.getByText('Document Vault')).toBeInTheDocument();
        expect(screen.getByText('Active MCP Server')).toBeInTheDocument();
        expect(screen.getByText('localhost:8000/api/mcp/sse')).toBeInTheDocument();
    });

    it('handles switch toggles for tools', async () => {
        const user = userEvent.setup();
        const handleRagChange = vi.fn();
        render(
            <WorkspacePanel
                ragActive={true}
                onRagChange={handleRagChange}
                sandboxActive={true}
                onSandboxChange={vi.fn()}
                sqlAuditActive={false}
                onSqlAuditChange={vi.fn()}
            />
        );

        const ragSwitch = screen.getByRole('switch', { name: /toggle hybrid rag search tool/i });
        await user.click(ragSwitch);
        expect(handleRagChange).toHaveBeenCalledWith(false);
    });
});
