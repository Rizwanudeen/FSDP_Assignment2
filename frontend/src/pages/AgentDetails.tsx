import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, Cpu, Zap, Clock, Settings, BrainCircuit, Activity, ArrowLeft } from 'lucide-react';
import agentService from '../services/agentService';
import VisibilityToggle from '../components/VisibilityToggle';

type AgentConfiguration = {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  capabilities: string[];
};

export default function AgentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    async function loadAgent() {
      try {
        if (!id) return;
        const data = await agentService.getAgent(id);
        setAgent(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load agent details');
      } finally {
        setLoading(false);
      }
    }
    loadAgent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Agent not found</div>
      </div>
    );
  }

  const config: AgentConfiguration = agent.configuration;
  const isAgentAvailable = agent.status === 'ACTIVE' || agent.status === 'TRAINING';

  const TabButton = ({ tabName, currentTab, setTab, icon: Icon, label }: { tabName: string, currentTab: string, setTab: (tab: string) => void, icon: React.ElementType, label: string }) => (
    <button
      onClick={() => setTab(tabName)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg
        ${currentTab === tabName
          ? 'bg-white text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words">{agent.name}</h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">{agent.description}</p>
                {agent.isOwner !== 0 && (
                  <div className="mt-3">
                    <VisibilityToggle
                      resourceType="agent"
                      resourceId={agent.id}
                      currentVisibility={agent.visibility || 'private'}
                      onUpdate={(newVisibility) => {
                        setAgent({ ...agent, visibility: newVisibility });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-gray-50 overflow-x-auto">
            <nav className="flex gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8 min-w-max">
              <TabButton tabName="Overview" currentTab={activeTab} setTab={setActiveTab} icon={BrainCircuit} label="Overview" />
              <TabButton tabName="Configuration" currentTab={activeTab} setTab={setActiveTab} icon={Settings} label="Configuration" />
              <TabButton tabName="Capabilities" currentTab={activeTab} setTab={setActiveTab} icon={Zap} label="Capabilities" />
              <TabButton tabName="Activity" currentTab={activeTab} setTab={setActiveTab} icon={Activity} label="Activity" />
            </nav>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === 'Overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Personality</h3>
                  <p className="text-sm sm:text-base text-gray-800">{agent.type || 'Not defined'}</p>
                </div>
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Created</h3>
                  <p className="text-sm sm:text-base text-gray-800">{new Date(agent.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Last Activity</h3>
                  <p className="text-sm sm:text-base text-gray-800">{agent.lastActive ? new Date(agent.lastActive).toLocaleString() : 'No activity yet'}</p>
                </div>
              </div>
            )}

            {activeTab === 'Configuration' && (
              <div className="border rounded-lg p-6 bg-white">
                <h3 className="flex items-center gap-3 text-lg font-semibold mb-6">
                  <Cpu /> Model Configuration
                </h3>
                <div className="space-y-5">
                  <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-gray-600">Model</span>
                    <span className="font-semibold text-gray-800">{config.model}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-gray-600">Temperature</span>
                    <span className="font-semibold text-gray-800">{config.temperature}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-4">
                    <span className="text-gray-600">Max Tokens</span>
                    <span className="font-semibold text-gray-800">{config.maxTokens}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">System Prompt</span>
                    <p className="mt-2 text-gray-800 bg-gray-50 p-4 rounded-md border">{config.systemPrompt || 'Not set'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Capabilities' && (
              <div className="border rounded-lg p-6 bg-white">
                <h3 className="flex items-center gap-3 text-lg font-semibold mb-6">
                  <Zap /> Agent Capabilities
                </h3>
                <div className="flex flex-wrap gap-3">
                  {config.capabilities.map((cap, idx) => (
                    <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'Activity' && (
              <div className="text-center text-gray-500 py-12">
                Activity tracking coming soon.
              </div>
            )}
          </div>
          
          <div className="p-6 bg-gray-50 text-right border-t">
            <button
              onClick={() => navigate(`/conversation?agentId=${agent.id}`)}
              disabled={!isAgentAvailable}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              title={!isAgentAvailable ? `Agent is ${agent.status.toLowerCase()} - chatting disabled` : ''}
            >
              Start Conversation
            </button>
            {!isAgentAvailable && (
              <p className="text-sm text-yellow-600 mt-2">⚠️ Agent status is {agent.status.toLowerCase()} - Change status to "Active" or "Training" to enable chatting</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}