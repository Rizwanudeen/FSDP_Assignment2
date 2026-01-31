import { logger } from '../utils/logger.js';

class MockDatabase {
  private static instance: MockDatabase;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
    }
    return MockDatabase.instance;
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      this.isConnected = true;
      logger.info('✅ Mock Database connected successfully');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      this.isConnected = false;
      logger.info('Mock Database disconnected');
    }
  }

  isConnectedToDB(): boolean {
    return this.isConnected;
  }
}

export const mockDb = MockDatabase.getInstance();

export async function connectDatabase() {
  await mockDb.connect();
}

export async function disconnectDatabase() {
  await mockDb.disconnect();
}