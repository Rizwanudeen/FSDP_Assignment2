import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Play,
  Loader,
  CheckCircle2,
  Bot,
  Zap,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { teamService, CollaborativeTask } from '../services/teamService';

interface ExecutionEvent {
  type: string;
  timestamp: string;
  data: any;
}

export default function CollaborativeTaskExecution() {
  const { teamId, taskId } = useParams<{ teamId: string; taskId: string }>();
  const navigate = useNavigate();
  const [isExecuting, setIsExecuting] = useState(false);
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [currentStream, setCurrentStream] = useState<{ agentId: string; content: string } | null>(
    null
  );
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Fetch task details
  const { data: task } = useQuery<CollaborativeTask>({
    queryKey: ['task', teamId, taskId],
    queryFn: () => teamService.getTaskById(teamId!, taskId!),
    enabled: !!teamId && !!taskId,
  });

  const scrollToBottom = () => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [events, currentStream]);

  const executeTask = async () => {
    console.log('🚀 Execute task clicked');
    setIsExecuting(true);
    setEvents([]);
    setActiveAgents(new Set());
    setCurrentStream(null);
    setFinalResult(null);

    try {
      console.log('📡 Calling teamService.executeTask', { teamId, taskId });
      await teamService.executeTask(teamId!, taskId!, (event, data) => {
        console.log('📥 Event received:', event, data);
        const timestamp = new Date().toISOString();

        switch (event) {
          case 'status':
            setEvents((prev) => [...prev, { type: 'status', timestamp, data }]);
            break;

          case 'agent_start':
            setActiveAgents((prev) => new Set(prev).add(data.agentId));
            setEvents((prev) => [...prev, { type: 'agent_start', timestamp, data }]);
            setCurrentStream({ agentId: data.agentId, content: '' });
            break;

          case 'agent_stream':
            setCurrentStream((prev) =>
              prev && prev.agentId === data.agentId
                ? { ...prev, content: prev.content + data.content }
                : prev
            );
            break;

          case 'agent_complete':
            setActiveAgents((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.agentId);
              return newSet;
            });
            setEvents((prev) => [...prev, { type: 'agent_complete', timestamp, data }]);
            setCurrentStream(null);
            break;

          case 'synthesis':
            setEvents((prev) => [...prev, { type: 'synthesis', timestamp, data }]);
            break;

          case 'complete':
            setEvents((prev) => [...prev, { type: 'complete', timestamp, data }]);
            setFinalResult(data.result);
            setIsExecuting(false);
            break;

          case 'error':
            setEvents((prev) => [...prev, { type: 'error', timestamp, data }]);
            setIsExecuting(false);
            break;
        }
      });
    } catch (error) {
      console.error('Execution error:', error);
      setIsExecuting(false);
      setEvents((prev) => [
        ...prev,
        {
          type: 'error',
          timestamp: new Date().toISOString(),
          data: { message: 'Failed to execute task' },
        },
      ]);
    }
  };

  const getAgentColor = (agentId: string) => {
    const colors = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-purple-500',
      'from-indigo-500 to-blue-500',
    ];
    const hash = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/teams/${teamId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Back to Team"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{task.title}</h1>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
            {!isExecuting && !finalResult && (
              <button
                onClick={executeTask}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition"
              >
                <Play className="h-5 w-5" />
                Start Execution
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Status Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Team Status
              </h2>

              <div className="space-y-3">
                {task.assignments?.map((assignment) => {
                  const isActive = activeAgents.has(assignment.agentId);
                  return (
                    <div
                      key={assignment.id}
                      className={`border rounded-lg p-4 transition ${
                        isActive ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${getAgentColor(
                            assignment.agentId
                          )} rounded-lg flex items-center justify-center text-white font-bold`}
                        >
                          {assignment.agentName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">
                              {assignment.agentName}
                            </h3>
                            {isActive && <Loader className="h-3 w-3 animate-spin text-blue-600" />}
                            {assignment.status === 'COMPLETED' && !isActive && (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{assignment.role}</p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                              isActive
                                ? 'bg-blue-100 text-blue-700'
                                : assignment.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {isActive ? 'Working...' : assignment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Execution Log */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Execution Log
              </h2>

              {events.length === 0 && !isExecuting && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Ready to Execute</h3>
                  <p className="text-gray-600 mb-4">
                    Click "Start Execution" to begin the collaborative task
                  </p>
                </div>
              )}

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {events.map((event, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    {event.type === 'status' && (
                      <div className="flex items-start gap-2">
                        <Loader className="h-4 w-4 text-blue-600 mt-1 animate-spin" />
                        <div>
                          <p className="text-sm text-gray-600">{event.data.message}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {event.type === 'agent_start' && (
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 bg-gradient-to-br ${getAgentColor(
                            event.data.agentId
                          )} rounded-lg flex items-center justify-center text-white font-bold text-xs`}
                        >
                          {event.data.agentName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {event.data.agentName} started working
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Role: {event.data.role}
                          </p>
                          <p className="text-sm text-gray-600">Subtask: {event.data.subtask}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {event.type === 'agent_complete' && (
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 bg-gradient-to-br ${getAgentColor(
                            event.data.agentId
                          )} rounded-lg flex items-center justify-center`}
                        >
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-green-600">
                            {event.data.agentName} completed
                          </p>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">{event.data.result}</p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {event.type === 'synthesis' && (
                      <div className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-purple-600 mt-1" />
                        <div>
                          <p className="font-semibold text-sm text-purple-600">
                            {event.data.message}
                          </p>
                          <span className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {event.type === 'complete' && (
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                        <div>
                          <p className="font-semibold text-sm text-green-600">
                            Task completed successfully!
                          </p>
                          <span className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {event.type === 'error' && (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-1" />
                        <div>
                          <p className="font-semibold text-sm text-red-600">Error occurred</p>
                          <p className="text-sm text-red-600">{event.data.message}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Current Streaming */}
                {currentStream && (
                  <div className="border-l-4 border-blue-500 pl-4 py-2 animate-pulse">
                    <div className="flex items-start gap-3">
                      <Loader className="h-4 w-4 text-blue-600 mt-1 animate-spin" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-blue-600">Streaming response...</p>
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{currentStream.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={eventsEndRef} />
              </div>

              {/* Final Result */}
              {finalResult && (
                <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-500">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <h3 className="text-xl font-bold text-green-900">Final Result</h3>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-gray-800">{finalResult}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
