export interface HybridSearchRequest {
    query: string;
    documentId?: string | null;
    limit?: number;
    denseWeight?: number;
    sparseWeight?: number;
    rrfK?: number;
}

export interface HybridSearchResult {
    id: string;
    documentId: string;
    chunkIndex: number;
    content: string;
    filename: string;
    similarityScore: number;
    denseRank?: number | null;
    sparseRank?: number | null;
    denseScore?: number | null;
    sparseScore?: number | null;
    startLine?: number | null;
    endLine?: number | null;
    headerPath?: string[];
    metadata?: Record<string, unknown>;
}

export interface HybridSearchResponse {
    query: string;
    totalResults: number;
    results: HybridSearchResult[];
}
