import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ChatHistorySidebar } from './ChatHistorySidebar';

describe('ChatHistorySidebar Component', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes('/api/chat/history/')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ conversation: { id: 'c1', title: 'LangGraph Flow' }, messages: [] })
                } as unknown as Response);
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ conversations: [] })
            } as unknown as Response);
        });
    });

    it('returns null when isGoogleUser is false', () => {
        const { container } = render(
            <ChatHistorySidebar isOpen={true} onClose={vi.fn()} onSelectConversation={vi.fn()} onNewChat={vi.fn()} isGoogleUser={false} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders drawer header, new chat, and search input when isGoogleUser is true', () => {
        render(<ChatHistorySidebar isOpen={true} onClose={vi.fn()} onSelectConversation={vi.fn()} onNewChat={vi.fn()} isGoogleUser={true} userId="user-123" />);

        expect(screen.getByRole('heading', { name: /chat history/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /close history/i })).toBeInTheDocument();
        expect(screen.getByRole('searchbox', { name: /search conversation history/i })).toBeInTheDocument();
    });

    it('calls onNewChat and onClose when new chat button is clicked', async () => {
        const user = userEvent.setup();
        const handleNewChat = vi.fn();
        const handleClose = vi.fn();

        render(
            <ChatHistorySidebar
                isOpen={true}
                onClose={handleClose}
                onSelectConversation={vi.fn()}
                onNewChat={handleNewChat}
                isGoogleUser={true}
                userId="user-123"
            />
        );

        const newChatBtn = screen.getByRole('button', { name: /new chat/i });
        await user.click(newChatBtn);

        expect(handleNewChat).toHaveBeenCalledTimes(1);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('filters cached conversations by title when typing in search input', async () => {
        const user = userEvent.setup();
        const cached = [
            {
                id: 'c1',
                userId: 'user-123',
                title: 'Raft Consensus Protocol Verification',
                createdAt: new Date().toISOString()
            },
            {
                id: 'c2',
                userId: 'user-123',
                title: 'PostgreSQL Vector Search Indexing',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('nexusagent_chat_history_user-123', JSON.stringify(cached));

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ conversations: cached })
        } as unknown as Response);

        render(<ChatHistorySidebar isOpen={true} onClose={vi.fn()} onSelectConversation={vi.fn()} onNewChat={vi.fn()} isGoogleUser={true} userId="user-123" />);

        expect(await screen.findByText('Raft Consensus Protocol Verification')).toBeInTheDocument();
        expect(screen.getByText('PostgreSQL Vector Search Indexing')).toBeInTheDocument();

        const searchInput = screen.getByRole('searchbox', { name: /search conversation history/i });
        await user.type(searchInput, 'Raft');

        expect(screen.getByText('Raft Consensus Protocol Verification')).toBeInTheDocument();
        expect(screen.queryByText('PostgreSQL Vector Search Indexing')).not.toBeInTheDocument();
    });

    it('triggers onSelectConversation when clicking an item', async () => {
        const user = userEvent.setup();
        const handleSelect = vi.fn();
        const handleClose = vi.fn();

        const cached = [
            {
                id: 'c1',
                userId: 'user-123',
                title: 'LangGraph Orchestration Flow',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('nexusagent_chat_history_user-123', JSON.stringify(cached));

        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes('/api/chat/history/c1')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ conversation: cached[0], messages: [] })
                } as unknown as Response);
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ conversations: cached })
            } as unknown as Response);
        });

        render(
            <ChatHistorySidebar
                isOpen={true}
                onClose={handleClose}
                onSelectConversation={handleSelect}
                onNewChat={vi.fn()}
                isGoogleUser={true}
                userId="user-123"
            />
        );

        const convItem = await screen.findByText('LangGraph Orchestration Flow');
        await user.click(convItem);

        expect(handleSelect).toHaveBeenCalledWith('c1', 'LangGraph Orchestration Flow', expect.any(Array), expect.any(Boolean));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
