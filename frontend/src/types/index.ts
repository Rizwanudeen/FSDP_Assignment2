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

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  detailedInstructions: string[];
  elementId?: string; // ID of DOM element to highlight
  action?: string; // What action to take (e.g., 'click', 'scroll')
  image?: string; // Optional image/GIF showing the step
}

export interface TutorialState {
  showTutorial: boolean;
  currentStep: number;
  isCompleted: boolean;
  hasSeenBefore: boolean;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  chunkCount: number;
}

export interface Document {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  isProcessed: boolean;
  chunkCount: number;
}

export interface SearchResult {
  id: string;
  text: string;
  filename: string;
  similarity: number;
}

export interface KBStats {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  chunkCount: number;
  totalSize: number;
  totalSearches: number;
  uniqueSearchers: number;
}