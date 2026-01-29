import api from './api';

export interface SearchResults {
  agents: any[];
  conversations: any[];
  tasks: any[];
  teams: any[];
}

export interface ShareRequest {
  id: string;
  resourceType: string;
  resourceId: string;
  requesterUserId: string;
  ownerUserId: string;
  status: string;
  createdAt: string;
  requesterName?: string;
  requesterEmail?: string;
  resourceName?: string;
}

export interface SharedResource {
  resourceType: string;
  resourceId: string;
  role: string;
  createdAt: string;
  resourceName: string;
  ownerId: string;
  ownerName: string;
}

export const shareService = {
  // Search for users
  searchUsers: async (query: string) => {
    const response = await api.get('/search/users', { params: { query } });
    return response.data;
  },

  // Get user's public resources
  getUserPublicResources: async (userId: string) => {
    const response = await api.get(`/users/${userId}/public-resources`);
    return response.data;
  },

  // Search for public resources
  searchPublic: async (query: string): Promise<SearchResults> => {
    const response = await api.get('/search/public', { params: { query } });
    return response.data;
  },

  // Create a share request
  createRequest: async (resourceType: string, resourceId: string) => {
    const response = await api.post('/share-requests', {
      resourceType,
      resourceId,
    });
    return response.data;
  },

  // Get pending requests (for owners)
  getPendingRequests: async (): Promise<ShareRequest[]> => {
    const response = await api.get('/share-requests/pending');
    return response.data;
  },

  // Approve a request
  approveRequest: async (requestId: string) => {
    const response = await api.post(`/share-requests/${requestId}/approve`);
    return response.data;
  },

  // Deny a request
  denyRequest: async (requestId: string) => {
    const response = await api.post(`/share-requests/${requestId}/deny`);
    return response.data;
  },

  // Toggle resource visibility
  toggleVisibility: async (
    resourceType: string,
    resourceId: string,
    visibility: 'public' | 'private'
  ) => {
    const response = await api.patch(
      `/resources/${resourceType}/${resourceId}/visibility`,
      { visibility }
    );
    return response.data;
  },

  // Get shared resources for the logged-in user
  getSharedResources: async (): Promise<SharedResource[]> => {
    const response = await api.get('/shared-resources');
    return response.data;
  },
};
