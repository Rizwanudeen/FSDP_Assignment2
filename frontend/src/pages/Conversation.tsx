import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import { agentService } from '../services/agentService';

type Agent = {
	id: string;
	name: string;
	description: string;
	status: string;
};

export default function Conversation() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const paramAgent = searchParams.get('agentId') || '';
	const paramConversation = searchParams.get('conversationId') || undefined;
	const [agentId, setAgentId] = useState(paramAgent);
	const [conversationId, setConversationId] = useState<string | undefined>(paramConversation);

	// Update URL when agentId changes
	const handleAgentChange = (newAgentId: string) => {
		// Only clear conversation if actually switching to a different agent
		if (newAgentId !== agentId) {
			setAgentId(newAgentId);
			setConversationId(undefined);
			setSearchParams({ agentId: newAgentId });
		}
	};

	// Update URL when conversationId changes
	const handleConversationChange = (newConversationId: string | undefined) => {
		setConversationId(newConversationId);
		if (newConversationId) {
			setSearchParams({ agentId, conversationId: newConversationId });
		} else {
			setSearchParams({ agentId });
		}
	};

	// Fetch agents for selection
	const { data: agents = [], isLoading, error } = useQuery({
		queryKey: ['agents'],
		queryFn: async () => agentService.getAgents(),
	});

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header with back button */}
			<div className="bg-white border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<button
						onClick={() => navigate('/')}
						className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Dashboard
					</button>
				</div>
			</div>

			{/* Main content */}
			<div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
				<div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
					{/* Agent selector sidebar */}
					<aside className="w-full lg:w-80 bg-white rounded shadow p-3 sm:p-4 flex flex-col max-h-[200px] lg:max-h-none">
						<h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Select an Agent</h2>

						{isLoading ? (
							<div className="text-sm text-gray-500">Loading agents...</div>
						) : error ? (
							<div className="text-sm text-red-600">Failed to load agents</div>
						) : agents.length === 0 ? (
							<div className="text-sm text-gray-500">No agents available. Create one in Agent Builder.</div>
						) : (
							<div className="flex-1 overflow-auto space-y-2">
								{agents.map((a: Agent) => {
									const isAvailable = a.status === 'ACTIVE' || a.status === 'TRAINING';
									return (
										<button
											key={a.id}
											onClick={() => handleAgentChange(a.id)}
											className={`w-full text-left px-3 py-2 rounded ${
												agentId === a.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'
											} ${!isAvailable ? 'opacity-60' : ''}`}
											title={!isAvailable ? `Agent is ${a.status.toLowerCase()} - chatting disabled` : ''}
										>
											<div className="flex justify-between items-center">
												<div className="flex-1">
													<div className="font-medium flex items-center gap-2">
														{a.name}
														{!isAvailable && (
															<span className="inline-block w-2 h-2 bg-yellow-500 rounded-full" title="Unavailable"></span>
														)}
													</div>
													<div className="text-xs text-gray-500">{a.description}</div>
												</div>
												<div className={`text-xs px-2 py-1 rounded ${
													a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
													a.status === 'TRAINING' ? 'bg-blue-100 text-blue-700' :
													a.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
													'bg-red-100 text-red-700'
												}`}>
													{a.status}
												</div>
											</div>
										</button>
									);
								})}
							</div>
						)}

						<div className="mt-4">
							<label className="block text-sm text-gray-700">Agent ID (manual)</label>
							<input
								className="mt-1 border rounded px-3 py-2 w-full"
								value={agentId}
								onChange={(e) => setAgentId(e.target.value)}
								placeholder="Or paste an agent id here"
							/>
						</div>
					</aside>

					{/* Chat interface */}
					<main className="flex-1 bg-gray-50 rounded-lg p-2 sm:p-4 min-h-[400px] sm:min-h-[600px]">
						{agentId ? (
							<ChatInterface 
								agentId={agentId} 
								conversationId={conversationId}
								onConversationChange={handleConversationChange}
							/>
						) : (
							<div className="text-sm sm:text-base text-gray-500 text-center p-8">Select an agent from above to start a conversation.</div>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}
