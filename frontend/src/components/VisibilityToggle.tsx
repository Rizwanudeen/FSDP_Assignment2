import { useState } from 'react';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shareService } from '../services/shareService';

interface VisibilityToggleProps {
  resourceType: 'agent' | 'conversation' | 'task' | 'team';
  resourceId: string;
  currentVisibility: 'public' | 'private';
  onUpdate?: (newVisibility: 'public' | 'private') => void;
}

export default function VisibilityToggle({
  resourceType,
  resourceId,
  currentVisibility,
  onUpdate,
}: VisibilityToggleProps) {
  const [visibility, setVisibility] = useState<'public' | 'private'>(currentVisibility);
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (newVisibility: 'public' | 'private') =>
      shareService.toggleVisibility(resourceType, resourceId, newVisibility),
    onSuccess: (_, newVisibility) => {
      setVisibility(newVisibility);
      queryClient.invalidateQueries({ queryKey: [resourceType + 's'] });
      if (onUpdate) {
        onUpdate(newVisibility);
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update visibility');
    },
  });

  const handleToggle = () => {
    const newVisibility = visibility === 'public' ? 'private' : 'public';
    
    const confirmMessage =
      newVisibility === 'public'
        ? 'Make this resource public? Anyone can discover and request access to it.'
        : 'Make this resource private? It will no longer be discoverable by others.';
    
    if (confirm(confirmMessage)) {
      toggleMutation.mutate(newVisibility);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={toggleMutation.isPending}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          visibility === 'public'
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={`Current visibility: ${visibility}. Click to toggle.`}
      >
        {toggleMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : visibility === 'public' ? (
          <Globe className="w-4 h-4" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        <span className="capitalize">{visibility}</span>
      </button>
    </div>
  );
}
