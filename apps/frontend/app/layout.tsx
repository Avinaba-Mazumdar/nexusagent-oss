import type { Metadata } from 'next';
import { Instrument_Sans, Outfit, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';

const instrumentSans = Instrument_Sans({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap'
});

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-heading',
    display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap'
});

export const metadata: Metadata = {
    title: 'NexusAgent (Archon) — Autonomous Systems Analyst',
    description:
        'Enterprise-grade autonomous systems analyst and architecture intelligence engine powered by LangGraph, LlamaIndex, Neon PostgreSQL 18, and MCP v2.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${instrumentSans.variable} ${outfit.variable} ${jetbrainsMono.variable} dark`}>
            <body className="bg-background text-foreground antialiased font-sans min-h-screen">{children}</body>
        </html>
    );
}
