import api from './api';
import { KnowledgeBase, Document, SearchResult, KBStats } from '../types';

export const knowledgeBaseService = {
  // Knowledge Base CRUD
  createKB: (name: string, description?: string) =>
    api.post<{ success: boolean; data: KnowledgeBase }>('/knowledge-bases', {
      name,
      description,
    }),

  getKBs: () =>
    api.get<{ success: boolean; data: KnowledgeBase[] }>('/knowledge-bases'),

  getKB: (kbId: string) =>
    api.get<{ success: boolean; data: KnowledgeBase }>(
      `/knowledge-bases/${kbId}`
    ),

  deleteKB: (kbId: string) =>
    api.delete<{ success: boolean }>(`/knowledge-bases/${kbId}`),

  // Document management
  uploadDocument: (kbId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post<{
      success: boolean;
      data: {
        documentId: string;
        filename: string;
        fileType: string;
        chunkCount: number;
        tokenCount: number;
      };
    }>(`/knowledge-bases/${kbId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getDocuments: (kbId: string) =>
    api.get<{ success: boolean; data: Document[] }>(
      `/knowledge-bases/${kbId}/documents`
    ),

  deleteDocument: (kbId: string, docId: string) =>
    api.delete<{ success: boolean }>(
      `/knowledge-bases/${kbId}/documents/${docId}`
    ),

  // Search
  search: (kbId: string, query: string, topK: number = 5) =>
    api.post<{
      success: boolean;
      data: {
        query: string;
        results: SearchResult[];
        count: number;
      };
    }>(`/knowledge-bases/${kbId}/search`, { query, topK }),

  // Stats
  getStats: (kbId: string) =>
    api.get<{ success: boolean; data: KBStats }>(
      `/knowledge-bases/${kbId}/stats`
    ),

  getSearchHistory: (kbId: string, limit: number = 20) =>
    api.get<{
      success: boolean;
      data: Array<{
        id: string;
        searchQuery: string;
        resultsReturned: number;
        searchedAt: string;
      }>;
    }>(`/knowledge-bases/${kbId}/search-history?limit=${limit}`),
};

export default knowledgeBaseService;
