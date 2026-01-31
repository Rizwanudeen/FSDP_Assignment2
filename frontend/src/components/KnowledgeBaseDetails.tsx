import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import knowledgeBaseService from '../services/knowledgeBaseService';
import DocumentUploader from './DocumentUploader';
import { Document, SearchResult } from '../types';

interface KnowledgeBaseDetailsProps {
  kbId: string;
  onBack?: () => void;
}

export default function KnowledgeBaseDetails({
  kbId,
  onBack,
}: KnowledgeBaseDetailsProps) {
  const [activeTab, setActiveTab] = useState<'documents' | 'search'>('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();

  const { data: kb, isLoading: kbLoading } = useQuery({
    queryKey: ['knowledge-base', kbId],
    queryFn: async () => {
      const res = await knowledgeBaseService.getKB(kbId);
      return res.data.data;
    },
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['kb-documents', kbId],
    queryFn: async () => {
      const res = await knowledgeBaseService.getDocuments(kbId);
      return res.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['kb-stats', kbId],
    queryFn: async () => {
      const res = await knowledgeBaseService.getStats(kbId);
      return res.data.data;
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) =>
      knowledgeBaseService.deleteDocument(kbId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-documents', kbId] });
      queryClient.invalidateQueries({ queryKey: ['kb-stats', kbId] });
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await knowledgeBaseService.search(kbId, searchQuery, 10);
      setSearchResults(res.data.data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (kbLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{kb?.name}</h1>
          {kb?.description && (
            <p className="text-gray-600 mt-1">{kb.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Documents</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stats.documentCount}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Chunks</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stats.chunkCount}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Storage</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {(stats.totalSize / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Searches</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stats.totalSearches}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'search'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Search
        </button>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <DocumentUploader kbId={kbId} />

          {docsLoading ? (
            <div className="text-center py-8 text-gray-600">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No documents yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: Document) => (
                <div
                  key={doc.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {doc.filename}
                      </span>
                      {doc.isProcessed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <p>
                        Type: {doc.fileType.toUpperCase()} • Size:{' '}
                        {(doc.fileSize / 1024).toFixed(1)} KB
                      </p>
                      <p>{doc.chunkCount} chunks</p>
                      <p className="text-xs text-gray-500">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          'Delete this document? This action cannot be undone.'
                        )
                      ) {
                        deleteDocMutation.mutate(doc.id);
                      }
                    }}
                    disabled={deleteDocMutation.isPending}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search your knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Search className="h-5 w-5" />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Found {searchResults.length} relevant results
              </p>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        {result.filename}
                      </p>
                      <div className="mt-2 text-sm text-gray-700 line-clamp-3">
                        {result.text}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded text-sm font-medium">
                        {(result.similarity * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
