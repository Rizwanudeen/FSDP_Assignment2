export interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'CONVERSATIONAL' | 'ANALYTICAL' | 'CREATIVE' | 'AUTOMATION';
  status: 'ACTIVE' | 'PAUSED' | 'TRAINING' | 'ERROR';
  visibility?: 'public' | 'private';
  isOwner?: number;
  avatar?: string;
  capabilities: string[];
  configuration: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
  metrics: {
    totalInteractions: number;
    successRate: number;
    avgResponseTime: number;
    uptime: number;
  };
  createdAt: string;
  updatedAt: string;
  lastActive: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}