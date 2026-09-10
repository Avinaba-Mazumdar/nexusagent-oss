'use client';

import * as React from 'react';
import type { AgentNodeName, CitationItem, StepNode } from '@nexusagent/contracts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from '@/components/header';
import { WorkspacePanel } from '@/components/workspace';
import { SynthesisCanvas } from '@/components/canvas';
import { ObservabilityPanel } from '@/components/observability';

const initialCitation: CitationItem = {
    id: 'cite-1',
    documentId: 'doc-rfc104',
    filename: 'RFC-104-raft-consensus.md',
    startLine: 128,
    endLine: 145,
    snippet: 'Raft leader election guarantees safety under partition...',
    relevanceScore: 0.94,
    formattedBadge: 'RFC-104:L128-145'
};

const initialNodes: StepNode[] = [
    { id: '1', name: 'planner', label: 'Planner Node', status: 'completed' },
    { id: '2', name: 'retriever', label: 'Retriever Node', status: 'completed' },
    { id: '3', name: 'reflection', label: 'Reflection Critic', status: 'running' },
    { id: '4', name: 'synthesizer', label: 'Synthesizer Stream', status: 'idle' }
];

export default function Home() {
    const [ragActive, setRagActive] = React.useState(true);
    const [sandboxActive, setSandboxActive] = React.useState(true);
    const [sqlAuditActive, setSqlAuditActive] = React.useState(false);
    const [inputPrompt, setInputPrompt] = React.useState('');

    const [currentNode] = React.useState<AgentNodeName>('reflection');
    const [activeCitation] = React.useState<CitationItem>(initialCitation);
    const [sampleNodes] = React.useState<StepNode[]>(initialNodes);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <TooltipProvider>
            <a href="#main-canvas" className="skip-link">
                Skip to main content
            </a>

            <div className="h-screen flex flex-col bg-[#f4f5f8] text-[#0f172a] font-sans overflow-hidden">
                <Header version="Archon v0.1.0" quota="Quota: 5/5 Available" interval="last 5 min" />

                <div className="flex-1 flex overflow-hidden">
                    <WorkspacePanel
                        ragActive={ragActive}
                        onRagChange={setRagActive}
                        sandboxActive={sandboxActive}
                        onSandboxChange={setSandboxActive}
                        sqlAuditActive={sqlAuditActive}
                        onSqlAuditChange={setSqlAuditActive}
                    />

                    <SynthesisCanvas
                        currentNode={currentNode}
                        activeCitation={activeCitation}
                        inputPrompt={inputPrompt}
                        onInputPromptChange={setInputPrompt}
                        onSubmitPrompt={handleFormSubmit}
                    />

                    <ObservabilityPanel nodes={sampleNodes} />
                </div>
            </div>
        </TooltipProvider>
    );
}
