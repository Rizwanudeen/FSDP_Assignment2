import { storage } from './mockStorage';

class MockPrismaClient {
  // Persistent storage using file system
  private _agents: any[] = storage.loadAgents();
  private _users: any[] = storage.loadUsers();
  private _conversations: any[] = storage.loadConversations();
  private _messages: any[] = storage.loadMessages();

  // Helper to generate simple ids
  private makeId(prefix = '') {
    return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 10000)}`;
  }

  agent = {
    findMany: async (opts?: any) => {
      const where = opts?.where || {};
      if (where.userId) {
        return this._agents.filter((a) => a.userId === where.userId);
      }
      return [...this._agents].sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    },

    findFirst: async (opts?: any) => {
      const where = opts?.where || {};
      return this._agents.find((a) => {
        if (where.id && a.id !== where.id) return false;
        if (where.userId && a.userId !== where.userId) return false;
        return true;
      }) || null;
    },

    findUnique: async (opts?: any) => {
      const id = opts?.where?.id;
      return this._agents.find((a) => a.id === id) || null;
    },

    create: async (opts: any) => {
      const data = opts.data || {};
      const now = new Date().toISOString();
      const agent = {
        id: data.id || this.makeId('agent_'),
        name: data.name,
        description: data.description,
        type: data.type,
        status: data.status || 'ACTIVE',
        avatar: data.avatar || null,
        capabilities: data.capabilities || [],
        configuration: data.configuration || {},
        metrics: data.metrics || { totalInteractions: 0, successRate: 0, avgResponseTime: 0, uptime: 0 },
        lastActive: data.lastActive || now,
        userId: data.userId,
        createdAt: now,
        updatedAt: now,
      };
      this._agents.push(agent);
      storage.saveAgents(this._agents);
      return agent;
    },

    update: async (opts: any) => {
      const id = opts.where?.id;
      const data = opts.data || {};
      const idx = this._agents.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      const updated = { ...this._agents[idx], ...data, updatedAt: new Date().toISOString() };
      this._agents[idx] = updated;
      storage.saveAgents(this._agents);
      return updated;
    },

    delete: async (opts: any) => {
      const id = opts.where?.id;
      const idx = this._agents.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      const [removed] = this._agents.splice(idx, 1);
      storage.saveAgents(this._agents);
      return removed;
    },
  };

  user = {
    findUnique: async (opts?: any) => {
      const where = opts?.where || {};
      if (where.email) return this._users.find((u) => u.email === where.email) || null;
      if (where.id) return this._users.find((u) => u.id === where.id) || null;
      return null;
    },

    create: async (opts: any) => {
      const data = opts.data || {};
      const user = { id: data.id || this.makeId('user_'), ...data };
      this._users.push(user);
      storage.saveUsers(this._users);
      return user;
    },
  };

  conversation = {
    findMany: async (opts?: any) => {
      const where = opts?.where || {};
      if (where.userId) return this._conversations.filter((c) => c.userId === where.userId);
      return [...this._conversations];
    },

    findFirst: async (opts?: any) => {
      const where = opts?.where || {};
      return this._conversations.find((c) => {
        if (where.id && c.id !== where.id) return false;
        if (where.userId && c.userId !== where.userId) return false;
        if (where.agentId && c.agentId !== where.agentId) return false;
        return true;
      }) || null;
    },

    create: async (opts: any) => {
      const data = opts.data || {};
      const now = new Date().toISOString();
      const conv = { id: data.id || this.makeId('conv_'), title: data.title || '', userId: data.userId, agentId: data.agentId, createdAt: now, updatedAt: now, messages: [] };
      this._conversations.push(conv);
      storage.saveConversations(this._conversations);
      return conv;
    },

    delete: async (opts: any) => {
      const id = opts.where?.id;
      const idx = this._conversations.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      const [removed] = this._conversations.splice(idx, 1);
      storage.saveConversations(this._conversations);
      return removed;
    },
  };

  message = {
    create: async (opts: any) => {
      const data = opts.data || {};
      const now = new Date().toISOString();
      const msg = { id: this.makeId('msg_'), conversationId: data.conversationId, role: data.role, content: data.content, createdAt: now, updatedAt: now };
      this._messages.push(msg);
      // attach to conversation if exists
      const conv = this._conversations.find((c) => c.id === data.conversationId);
      if (conv) {
        conv.messages = conv.messages || [];
        conv.messages.push(msg);
        conv.updatedAt = now;
        storage.saveConversations(this._conversations);
      }
      storage.saveMessages(this._messages);
      return msg;
    },
  };

  async $connect() {
    return Promise.resolve();
  }

  async $disconnect() {
    return Promise.resolve();
  }
}

export const prisma = new MockPrismaClient();