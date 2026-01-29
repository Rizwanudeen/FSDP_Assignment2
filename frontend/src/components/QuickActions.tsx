import { Plus, MessageSquare, BarChart3 } from 'lucide-react';

type Props = {
  onNewAgent: () => void;
  onTestAgent: () => void;
  onViewAnalytics: () => void;
};

export default function QuickActions({ onNewAgent, onTestAgent, onViewAnalytics }: Props) {
  const actions = [
    {
      name: 'Create New Agent',
      description: 'Build a custom AI agent for your needs',
      icon: Plus,
      onClick: onNewAgent,
      color: 'bg-blue-600',
    },
    {
      name: 'Test Agents',
      description: 'Try out your agents in conversation',
      icon: MessageSquare,
      onClick: onTestAgent,
      color: 'bg-green-600',
    },
    {
      name: 'View Analytics',
      description: 'Check performance and usage stats',
      icon: BarChart3,
      onClick: onViewAnalytics,
      color: 'bg-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      {actions.map((action) => (
        <button
          key={action.name}
          onClick={action.onClick}
          className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-white rounded-lg shadow border hover:border-blue-300 transition"
        >
          <div className={`p-2 sm:p-3 rounded-lg ${action.color} text-white flex-shrink-0`}>
            <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{action.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{action.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
