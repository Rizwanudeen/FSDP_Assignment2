import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, MessageSquare, FolderKanban, UsersRound, Mail, Calendar, Loader2, Globe } from 'lucide-react';
import { shareService } from '../services/shareService';

export default function UserResourcesPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['userPublicResources', userId],
    queryFn: () => shareService.getUserPublicResources(userId!),
    enabled: !!userId,
  });

  const requestAccessMutation = useMutation({
    mutationFn: ({ resourceType, resourceId }: { resourceType: string; resourceId: string }) =>
      shareService.createRequest(resourceType, resourceId),
    onSuccess: () => {
      alert('Access request sent successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to send request');
    },
  });

  const handleRequestAccess = (resourceType: string, resourceId: string) => {
    if (confirm('Request access to this resource?')) {
      requestAccessMutation.mutate({ resourceType, resourceId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate('/search')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Search</span>
            </button>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-12">
          <p className="text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  const { user, agents, conversations, tasks, teams } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Search</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Public Resources */}
        <div className="space-y-8">
          {/* Agents */}
          {agents && agents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Public Agents ({agents.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent: any) => (
                  <div
                    key={agent.id}
                    className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{agent.name}</h3>
                      <Globe className="w-4 h-4 text-green-600" />
                    </div>
                    {agent.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{agent.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {agent.type}
                      </span>
                      <button
                        onClick={() => handleRequestAccess('agent', agent.id)}
                        disabled={requestAccessMutation.isPending}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Request Access
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations */}
          {conversations && conversations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Public Conversations ({conversations.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {conversations.map((conv: any) => (
                  <div
                    key={conv.id}
                    className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{conv.title || 'Untitled'}</h3>
                      <Globe className="w-4 h-4 text-green-600" />
                    </div>
                    {conv.agentName && (
                      <p className="text-sm text-gray-600 mb-3">Agent: {conv.agentName}</p>
                    )}
                    <button
                      onClick={() => handleRequestAccess('conversation', conv.id)}
                      disabled={requestAccessMutation.isPending}
                      className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 w-full disabled:opacity-50"
                    >
                      Request Access
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks && tasks.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FolderKanban className="w-6 h-6" />
                Public Tasks ({tasks.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{task.title}</h3>
                      <Globe className="w-4 h-4 text-green-600" />
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mb-3 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                      {task.teamName && (
                        <span className="text-gray-500">Team: {task.teamName}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRequestAccess('task', task.id)}
                      disabled={requestAccessMutation.isPending}
                      className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 w-full disabled:opacity-50"
                    >
                      Request Access
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teams */}
          {teams && teams.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UsersRound className="w-6 h-6" />
                Public Teams ({teams.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team: any) => (
                  <div
                    key={team.id}
                    className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{team.name}</h3>
                      <Globe className="w-4 h-4 text-green-600" />
                    </div>
                    {team.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{team.description}</p>
                    )}
                    {team.objective && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                        Objective: {team.objective}
                      </p>
                    )}
                    <button
                      onClick={() => handleRequestAccess('team', team.id)}
                      disabled={requestAccessMutation.isPending}
                      className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 w-full disabled:opacity-50"
                    >
                      Request Access
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!agents || agents.length === 0) &&
            (!conversations || conversations.length === 0) &&
            (!tasks || tasks.length === 0) &&
            (!teams || teams.length === 0) && (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No public resources</h3>
                <p className="text-gray-600">
                  This user hasn't shared any public resources yet
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
