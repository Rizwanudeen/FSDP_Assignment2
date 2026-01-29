import { useState } from 'react';
import { Paperclip, X, FileText, Image, File } from 'lucide-react';

export interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'document';
}

interface FileUploadProps {
  onFilesSelected: (files: FilePreview[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export default function FileUpload({ onFilesSelected, maxFiles = 5, disabled = false }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: FilePreview[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'document'
    }));

    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      {/* File previews */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
          {selectedFiles.map((filePreview, index) => (
            <div
              key={index}
              className="relative group bg-white border rounded-lg p-2 flex items-center gap-2 max-w-[200px]"
            >
              {filePreview.type === 'image' ? (
                <img
                  src={filePreview.preview}
                  alt={filePreview.file.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  {getFileIcon(filePreview.file)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{filePreview.file.name}</p>
                <p className="text-xs text-gray-500">
                  {(filePreview.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File input */}
      {selectedFiles.length < maxFiles && (
        <label className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Paperclip className="h-4 w-4" />
          <span className="text-sm">Attach files</span>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
        </label>
      )}

      {selectedFiles.length > 0 && (
        <p className="text-xs text-gray-500">
          {selectedFiles.length} / {maxFiles} files selected
        </p>
      )}
    </div>
  );
}
