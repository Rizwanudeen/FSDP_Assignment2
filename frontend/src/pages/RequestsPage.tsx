import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Users, MessageSquare, FolderKanban, UsersRound, Inbox, Loader2, ArrowLeft } from 'lucide-react';
import { shareService, ShareRequest } from '../services/shareService';
import { useNavigate } from 'react-router-dom';

// Helper function to format relative time
const formatRelativeTime = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return past.toLocaleDateString();
};

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: shareService.getPendingRequests,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => shareService.approveRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      alert('Access granted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to approve request');
    },
  });

  const denyMutation = useMutation({
    mutationFn: (requestId: string) => shareService.denyRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      alert('Request denied');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to deny request');
    },
  });

  const handleApprove = (requestId: string) => {
    if (confirm('Grant access to this resource?')) {
      approveMutation.mutate(requestId);
    }
  };

  const handleDeny = (requestId: string) => {
    if (confirm('Deny this access request?')) {
      denyMutation.mutate(requestId);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'agent':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'conversation':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case 'task':
        return <FolderKanban className="w-5 h-5 text-purple-600" />;
      case 'team':
        return <UsersRound className="w-5 h-5 text-orange-600" />;
      default:
        return <Inbox className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'agent':
        return 'bg-blue-100 text-blue-800';
      case 'conversation':
        return 'bg-green-100 text-green-800';
      case 'task':
        return 'bg-purple-100 text-purple-800';
      case 'team':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Requests</h1>
        <p className="text-gray-600">
          Manage pending access requests for your resources
        </p>
      </div>

      {/* Requests List */}
      {requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request: ShareRequest) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Icon */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {getIcon(request.resourceType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {request.resourceName || 'Unknown Resource'}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(
                          request.resourceType
                        )}`}
                      >
                        {(request.resourceType || request.resource_type || 'unknown').toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium text-gray-700">Requester:</span>{' '}
                        {request.requesterName} ({request.requesterEmail})
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Requested:</span>{' '}
                        {formatRelativeTime(request.createdAt)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={approveMutation.isPending || denyMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeny(request.id)}
                    disabled={approveMutation.isPending || denyMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {denyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Deny
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-12">
          <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-600">
            You don't have any pending access requests at the moment
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
