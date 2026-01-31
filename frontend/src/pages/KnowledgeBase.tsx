import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import KnowledgeBaseList from '../components/KnowledgeBaseList';
import KnowledgeBaseDetails from '../components/KnowledgeBaseDetails';
import { KnowledgeBase } from '../types';

export default function KnowledgeBasePage() {
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Bases</h1>
          </div>
          <p className="text-gray-600">
            Build custom knowledge bases for your agents with documents and semantic search
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedKB ? (
          <KnowledgeBaseDetails
            kbId={selectedKB.id}
            onBack={() => setSelectedKB(null)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Getting Started
                </h2>
                <div className="space-y-4 text-gray-700">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Create a Knowledge Base
                      </h3>
                      <p className="text-sm text-gray-600">
                        Create a new knowledge base to organize your documents
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Upload Documents
                      </h3>
                      <p className="text-sm text-gray-600">
                        Upload PDFs, Word documents, or text files. Supported formats:
                        PDF, DOCX, TXT, Markdown
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Enable Semantic Search
                      </h3>
                      <p className="text-sm text-gray-600">
                        Documents are automatically converted to vector embeddings for
                        intelligent semantic search
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                      4
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Ground Your Agents
                      </h3>
                      <p className="text-sm text-gray-600">
                        Link knowledge bases to agents to provide context and prevent
                        hallucinations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    💡 Pro Tip: Why Knowledge Bases?
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Prevents AI hallucinations by grounding responses in your data
                    </li>
                    <li>
                      • Enables semantic search across documents using AI embeddings
                    </li>
                    <li>• Allows agents to reference company-specific information</li>
                    <li>• Works with any agent type for enhanced accuracy</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="bg-white rounded-lg p-6">
              <KnowledgeBaseList onSelectKB={setSelectedKB} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
