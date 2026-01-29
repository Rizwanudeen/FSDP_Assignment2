import { Edit, Trash2, Bot, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
}

export default function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  const navigate = useNavigate();
  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    TRAINING: 'bg-blue-100 text-blue-800',
    ERROR: 'bg-red-100 text-red-800',
  };

  const isAgentAvailable = agent.status === 'ACTIVE' || agent.status === 'TRAINING';

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start mb-4">
          {agent.avatar ? (
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[agent.status]}`}>
            {agent.status}
          </span>
        </div>

        <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
          {agent.type}
        </span>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Capabilities</h4>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.slice(0, 3).map((cap, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                {cap}
              </span>
            ))}
            {agent.capabilities.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{agent.capabilities.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold">{agent.metrics.totalInteractions}</div>
            <div className="text-xs text-gray-500">Interactions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{agent.metrics.successRate}%</div>
            <div className="text-xs text-gray-500">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{Math.round(agent.metrics.avgResponseTime)}ms</div>
            <div className="text-xs text-gray-500">Avg Response</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 flex flex-col gap-2">
        {!isAgentAvailable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <p className="text-xs text-yellow-800">⚠️ Chatting disabled - Agent status is {agent.status.toLowerCase()}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/conversation?agentId=${agent.id}`)}
            disabled={!isAgentAvailable}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            title={!isAgentAvailable ? `Agent is ${agent.status.toLowerCase()} - chatting disabled` : ''}
          >
            Start Conversation
          </button>
          <button
            onClick={() => navigate(`/agents/${agent.id}`)}
            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
          >
            View Details
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(agent)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(agent.id)}
            className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}