// src/services/teamService.ts

import api from './api';

export interface Team {
  id: string;
  name: string;
  description: string;
  userId: string;
  objective: string;
  status: string;
  visibility?: 'public' | 'private';
  isOwner?: number;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  agentId: string;
  role: string;
  isPrimaryAgent: boolean;
  addedAt: string;
  agent: {
    id: string;
    name: string;
    type: string;
    status: string;
    avatar?: string;
  };
}

export interface CollaborativeTask {
  id: string;
  teamId: string;
  userId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  visibility?: 'public' | 'private';
  isOwner?: number;
  canEdit?: number;
  result: string | null;
  versionCount?: number;
  createdAt: string;
  completedAt: string | null;
  assignments?: TaskAssignment[];
  contributions?: AgentContribution[];
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  role: string;
  subtaskDescription: string;
  status: string;
  result: string | null;
  startedAt: string | null;
  completedAt: string | null;
  executionOrder: number;
}

export interface AgentContribution {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  contribution: string;
  confidence: number;
  createdAt: string;
}

export const teamService = {
  // Teams
  async createTeam(data: {
    name: string;
    description?: string;
    objective?: string;
    members: Array<{ agentId: string; role: string; isPrimaryAgent?: boolean }>;
  }): Promise<Team> {
    const response = await api.post('/teams', data);
    return response.data.data;
  },

  async getTeams(): Promise<Team[]> {
    const response = await api.get('/teams');
    return response.data.data;
  },

  async getTeamById(teamId: string): Promise<Team> {
    const response = await api.get(`/teams/${teamId}`);
    return response.data.data;
  },

  async updateTeam(
    teamId: string,
    data: {
      name?: string;
      description?: string;
      objective?: string;
      status?: string;
    }
  ): Promise<Team> {
    const response = await api.put(`/teams/${teamId}`, data);
    return response.data.data;
  },

  // Team Members
  async addMember(
    teamId: string,
    data: { agentId: string; role: string; isPrimaryAgent?: boolean }
  ): Promise<Team> {
    const response = await api.post(`/teams/${teamId}/members`, data);
    return response.data.data;
  },

  async removeMember(teamId: string, memberId: string): Promise<void> {
    await api.delete(`/teams/${teamId}/members/${memberId}`);
  },

  // Collaborative Tasks
  async createTask(
    teamId: string,
    data: {
      title: string;
      description: string;
      priority?: string;
    }
  ): Promise<CollaborativeTask> {
    const response = await api.post(`/teams/${teamId}/tasks`, data);
    return response.data.data;
  },

  async getTasks(teamId: string): Promise<CollaborativeTask[]> {
    const response = await api.get(`/teams/${teamId}/tasks`);
    return response.data.data;
  },

  async getTaskById(teamId: string, taskId: string): Promise<CollaborativeTask> {
    const response = await api.get(`/teams/${teamId}/tasks/${taskId}`);
    return response.data.data;
  },

  async executeTask(
    teamId: string,
    taskId: string,
    onEvent: (event: string, data: any) => void
  ): Promise<void> {
    const response = await fetch(
      `${api.defaults.baseURL}/teams/${teamId}/tasks/${taskId}/execute`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to execute task');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');

      for (const line of lines) {
        if (line.startsWith('event:')) {
          const eventMatch = line.match(/event: (.+)/);
          const dataMatch = line.match(/data: (.+)/);

          if (eventMatch && dataMatch) {
            const event = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);
            onEvent(event, data);
          }
        }
      }
    }
  },

  deleteTask: async (teamId: string, taskId: string) => {
    const response = await api.delete(`/teams/${teamId}/tasks/${taskId}`);
    return response.data;
  },
};
