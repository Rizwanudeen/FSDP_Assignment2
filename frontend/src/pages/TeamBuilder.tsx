import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Users, Plus, X, Star, Save } from 'lucide-react';
import api from '../services/api';
import { teamService } from '../services/teamService';
import { Agent } from '../types';

interface TeamMemberForm {
  agentId: string;
  role: string;
  isPrimaryAgent: boolean;
}

export default function TeamBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [members, setMembers] = useState<TeamMemberForm[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [memberRole, setMemberRole] = useState('');

  // Fetch available agents
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await api.get('/agents');
      return response.data.data;
    },
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: (data: any) => teamService.createTeam(data),
    onSuccess: (team) => {
      navigate(`/teams/${team.id}`);
    },
  });

  const addMember = () => {
    if (!selectedAgent || !memberRole) {
      alert('Please select an agent and specify a role');
      return;
    }

    // Check if agent already added
    if (members.some((m) => m.agentId === selectedAgent)) {
      alert('This agent is already in the team');
      return;
    }

    setMembers([
      ...members,
      {
        agentId: selectedAgent,
        role: memberRole,
        isPrimaryAgent: members.length === 0, // First agent is primary by default
      },
    ]);

    setSelectedAgent('');
    setMemberRole('');
  };

  const removeMember = (agentId: string) => {
    setMembers(members.filter((m) => m.agentId !== agentId));
  };

  const togglePrimaryAgent = (agentId: string) => {
    setMembers(
      members.map((m) => ({
        ...m,
        isPrimaryAgent: m.agentId === agentId,
      }))
    );
  };

  const handleSubmit = () => {
    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    if (members.length < 2) {
      alert('A team must have at least 2 agents');
      return;
    }

    createTeamMutation.mutate({
      name: teamName,
      description,
      objective,
      members,
    });
  };

  const getAgentById = (agentId: string) => {
    return agents.find((a) => a.id === agentId);
  };

  // Suggested roles based on agent types
  const suggestedRoles = [
    'Intelligence Analyst',
    'Mission Planner',
    'Risk Assessor',
    'Technical Specialist',
    'Data Analyst',
    'Operations Coordinator',
    'Strategy Advisor',
    'Logistics Manager',
  ];

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
              onClick={() => navigate('/teams')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Back to Teams"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Create Team</h1>
                <p className="text-sm text-gray-600">Build a multi-agent collaboration team</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              1
            </div>
            <span className="font-medium">Team Info</span>
          </div>
          <div className="w-16 h-1 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              2
            </div>
            <span className="font-medium">Add Agents</span>
          </div>
          <div className="w-16 h-1 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              3
            </div>
            <span className="font-medium">Review</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8 max-w-4xl mx-auto">
          {/* Step 1: Team Info */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Team Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g., Mission Planning Team"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the team's purpose"
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Objective
                  </label>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="What is this team designed to accomplish?"
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!teamName.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Add Agents */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Add Team Members</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Select agents with complementary skills. The first agent you add
                  will be the primary coordinator.
                </p>
              </div>

              {/* Add Member Form */}
              <div className="border rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-4">Add Agent</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Agent
                    </label>
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose an agent...</option>
                      {agents
                        .filter((a) => a.status === 'ACTIVE')
                        .map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.type})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role in Team
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        placeholder="e.g., Intelligence Analyst"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        list="role-suggestions"
                      />
                      <datalist id="role-suggestions">
                        {suggestedRoles.map((role) => (
                          <option key={role} value={role} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <button
                  onClick={addMember}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition"
                >
                  <Plus className="h-4 w-4" />
                  Add to Team
                </button>
              </div>

              {/* Current Members */}
              {members.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Team Members ({members.length})</h3>
                  <div className="space-y-3">
                    {members.map((member) => {
                      const agent = getAgentById(member.agentId);
                      return (
                        <div
                          key={member.agentId}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                              {agent?.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{agent?.name}</h4>
                                {member.isPrimaryAgent && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    Primary
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{member.role}</p>
                              <p className="text-xs text-gray-500">{agent?.type}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!member.isPrimaryAgent && (
                              <button
                                onClick={() => togglePrimaryAgent(member.agentId)}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 transition"
                              >
                                Make Primary
                              </button>
                            )}
                            <button
                              onClick={() => removeMember(member.agentId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={members.length < 2}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Review & Create</h2>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3">Team Details</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-600">Name</dt>
                      <dd className="font-medium">{teamName}</dd>
                    </div>
                    {description && (
                      <div>
                        <dt className="text-sm text-gray-600">Description</dt>
                        <dd className="text-sm">{description}</dd>
                      </div>
                    )}
                    {objective && (
                      <div>
                        <dt className="text-sm text-gray-600">Objective</dt>
                        <dd className="text-sm">{objective}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3">Team Members ({members.length})</h3>
                  <div className="space-y-2">
                    {members.map((member) => {
                      const agent = getAgentById(member.agentId);
                      return (
                        <div key={member.agentId} className="flex items-center gap-3 p-3 bg-white rounded">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {agent?.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{agent?.name}</span>
                              {member.isPrimaryAgent && (
                                <Star className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createTeamMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2 transition"
                >
                  <Save className="h-4 w-4" />
                  {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
