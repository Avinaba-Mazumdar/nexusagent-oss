/**
 * Document & Citation Contracts
 *
 * Schemas for document metadata, vector chunks, reciprocal rank fusion (RRF)
 * search results, and inline line-level citations.
 */

export interface DocumentMetadata {
    id: string;
    userId: string;
    filename: string;
    mimeType: string;
    sha256Hash: string;
    totalChunks: number;
    storagePath?: string;
    isSeeded: boolean;
    uploadedAt: string;
}

export interface DocumentChunk {
    id: string;
    documentId: string;
    chunkIndex: number;
    content: string;
    startLine?: number;
    endLine?: number;
    embedding?: number[];
    metadata: Record<string, unknown>;
    createdAt: string;
}

export interface CitationItem {
    id: string;
    documentId: string;
    filename: string;
    startLine: number;
    endLine: number;
    snippet: string;
    relevanceScore: number;
    formattedBadge: string; // e.g. "[RFC-104:L128-145]"
}

export interface UploadDocumentResponse {
    document: DocumentMetadata;
    chunksCount: number;
    message: string;
}

export interface RRFSearchResult {
    chunkId: string;
    documentId: string;
    filename: string;
    content: string;
    startLine: number;
    endLine: number;
    denseRank: number;
    sparseRank: number;
    rrfScore: number;
}
