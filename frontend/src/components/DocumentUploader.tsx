import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, File, Plus, AlertCircle } from 'lucide-react';
import knowledgeBaseService from '../services/knowledgeBaseService';
import { KnowledgeBase } from '../types';

interface DocumentUploaderProps {
  kbId: string;
  onUploadSuccess?: () => void;
}

export default function DocumentUploader({
  kbId,
  onUploadSuccess,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => knowledgeBaseService.uploadDocument(kbId, file),
    onSuccess: () => {
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ['kb-documents', kbId] });
      onUploadSuccess?.();
    },
    onError: (error: any) => {
      setUploadError(error.response?.data?.error || 'Upload failed');
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError('File type not supported. Use PDF, DOCX, TXT, or Markdown.');
      return;
    }

    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25MB limit');
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
        } ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Documents
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop your files here, or click to browse
        </p>

        <p className="text-xs text-gray-500 mb-4">
          Supported: PDF, DOCX, TXT, Markdown • Max size: 25MB
        </p>

        <label className="inline-block">
          <input
            type="file"
            onChange={handleFileInput}
            disabled={uploadMutation.isPending}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md"
          />
          <button
            onClick={() =>
              document.querySelector('input[type="file"]')?.click()
            }
            disabled={uploadMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Choose File'}
          </button>
        </label>
      </div>

      {uploadError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">Upload Error</p>
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        </div>
      )}

      {uploadMutation.data && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">✓ Upload Successful</p>
          <p className="text-sm text-green-700">
            {uploadMutation.data.data.filename} • {uploadMutation.data.data.chunkCount} chunks processed
          </p>
        </div>
      )}
    </div>
  );
}
