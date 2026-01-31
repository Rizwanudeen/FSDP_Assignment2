import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, BookOpen, FileText, AlertCircle } from 'lucide-react';
import knowledgeBaseService from '../services/knowledgeBaseService';
import { KnowledgeBase } from '../types';

interface KnowledgeBaseListProps {
  onSelectKB?: (kb: KnowledgeBase) => void;
  onCreateNew?: () => void;
}

export default function KnowledgeBaseList({
  onSelectKB,
  onCreateNew,
}: KnowledgeBaseListProps) {
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: kbs = [], isLoading, error } = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: async () => {
      const res = await knowledgeBaseService.getKBs();
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      knowledgeBaseService.createKB(createName, createDesc),
    onSuccess: () => {
      setCreateName('');
      setCreateDesc('');
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (kbId: string) => knowledgeBaseService.deleteKB(kbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600">Loading knowledge bases...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-red-800 font-medium">Error loading knowledge bases</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create New KB Form */}
      {showCreateForm ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="Knowledge Base Name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <textarea
            placeholder="Description (optional)"
            value={createDesc}
            onChange={(e) => setCreateDesc(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!createName.trim() || createMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setCreateName('');
                setCreateDesc('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          New Knowledge Base
        </button>
      )}

      {/* KB List */}
      {kbs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No knowledge bases yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {kbs.map((kb: KnowledgeBase) => (
            <div
              key={kb.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div
                onClick={() => onSelectKB?.(kb)}
                className="cursor-pointer mb-2"
              >
                <h3 className="font-medium text-gray-900">{kb.name}</h3>
                {kb.description && (
                  <p className="text-sm text-gray-600 mt-1">{kb.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {kb.documentCount} documents
                  </span>
                  <span>{kb.chunkCount} chunks</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onSelectKB?.(kb)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors font-medium"
                >
                  Manage
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this knowledge base? This action cannot be undone.')) {
                      deleteMutation.mutate(kb.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
