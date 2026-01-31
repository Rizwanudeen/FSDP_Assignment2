import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
const initFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
  }
};

initFile(USERS_FILE);
initFile(AGENTS_FILE);
initFile(CONVERSATIONS_FILE);
initFile(MESSAGES_FILE);

export const storage = {
  loadUsers: () => {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  },
  saveUsers: (users: any[]) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  },
  loadAgents: () => {
    return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'));
  },
  saveAgents: (agents: any[]) => {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2));
  },
  loadConversations: () => {
    return JSON.parse(fs.readFileSync(CONVERSATIONS_FILE, 'utf8'));
  },
  saveConversations: (conversations: any[]) => {
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));
  },
  loadMessages: () => {
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  },
  saveMessages: (messages: any[]) => {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  }
};