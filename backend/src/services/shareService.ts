import { db, supabase } from "../config/database.js";
import { logger } from "../utils/logger.js";

export class ShareService {
  /**
   * Search for users by name or email
   */
  async searchUsers(query: string, currentUserId: string) {
    try {
      const searchTerm = `%${query}%`;
      
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .neq('id', currentUserId)
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`);

      if (error) throw error;

      return users || [];
    } catch (error) {
      logger.error("Search users error:", error);
      throw error;
    }
  }

  /**
   * Get a user's public resources
   */
  async getUserPublicResources(userId: string) {
    try {
      // Get user info
      const { data: userInfo, error: userError } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (!userInfo) {
        throw new Error("User not found");
      }

      // Get public agents
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, description, type, avatar, status, created_at')
        .eq('visibility', 'public')
        .eq('is_deleted', false)
        .eq('user_id', userId);

      if (agentsError) throw agentsError;

      // Get public conversations
      const { data: conversations, error: convsError } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          agent_id,
          created_at,
          agents!conversations_agent_id_fkey (name)
        `)
        .eq('visibility', 'public')
        .eq('user_id', userId);

      if (convsError) throw convsError;

      // Get public tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('collaborative_tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          team_id,
          created_at,
          teams!collaborative_tasks_team_id_fkey (name)
        `)
        .eq('visibility', 'public')
        .eq('user_id', userId);

      if (tasksError) throw tasksError;

      // Get public teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, description, objective, status, created_at')
        .eq('visibility', 'public')
        .eq('user_id', userId);

      if (teamsError) throw teamsError;

      return {
        user: userInfo,
        agents: agents || [],
        conversations: conversations || [],
        tasks: tasks || [],
        teams: teams || []
      };
    } catch (error) {
      logger.error("Get user public resources error:", error);
      throw error;
    }
  }

  /**
   * Search for public resources
   */
  async searchPublicResources(query: string, userId: string) {
    try {
      const searchTerm = `%${query}%`;
      
      // Search public agents
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          description,
          type,
          avatar,
          user_id,
          users!agents_user_id_fkey (name, email)
        `)
        .eq('visibility', 'public')
        .eq('is_deleted', false)
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);

      if (agentsError) throw agentsError;

      // Search public conversations
      const { data: conversations, error: convsError } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          user_id,
          agent_id,
          users!conversations_user_id_fkey (name, email),
          agents!conversations_agent_id_fkey (name)
        `)
        .eq('visibility', 'public')
        .ilike('title', searchTerm);

      if (convsError) throw convsError;

      // Search public tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('collaborative_tasks')
        .select(`
          id,
          title,
          description,
          status,
          user_id,
          team_id,
          users!collaborative_tasks_user_id_fkey (name, email),
          teams!collaborative_tasks_team_id_fkey (name)
        `)
        .eq('visibility', 'public')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);

      if (tasksError) throw tasksError;

      // Search public teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          objective,
          user_id,
          users!teams_user_id_fkey (name, email)
        `)
        .eq('visibility', 'public')
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},objective.ilike.${searchTerm}`);

      if (teamsError) throw teamsError;

      return {
        agents: (agents || []).map(a => ({
          ...a,
          resourceType: 'agent',
          ownerName: a.users?.name,
          ownerEmail: a.users?.email
        })),
        conversations: (conversations || []).map(c => ({
          ...c,
          resourceType: 'conversation',
          ownerName: c.users?.name,
          ownerEmail: c.users?.email,
          agentName: c.agents?.name
        })),
        tasks: (tasks || []).map(t => ({
          ...t,
          resourceType: 'task',
          ownerName: t.users?.name,
          ownerEmail: t.users?.email,
          teamName: t.teams?.name
        })),
        teams: (teams || []).map(t => ({
          ...t,
          resourceType: 'team',
          ownerName: t.users?.name,
          ownerEmail: t.users?.email
        }))
      };
    } catch (error) {
      logger.error("Search public resources error:", error);
      throw error;
    }
  }

  /**
   * Create a share request
   */
  async createShareRequest(
    resourceType: string,
    resourceId: string,
    requesterUserId: string
  ) {
    try {
      console.log("🔍 Validating requester user ID:", requesterUserId);
      
      // Check if user exists with COUNT to verify
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('id', requesterUserId);
      
      console.log("📊 User count check:", { count, error: countError?.message });
      
      // Validate requester user exists
      const { data: requesterUser, error: requesterError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', requesterUserId)
        .single();

      console.log("📊 User lookup result:", { 
        found: !!requesterUser, 
        error: requesterError?.message,
        userId: requesterUser?.id 
      });

      if (requesterError || !requesterUser || count === 0) {
        // List all users to debug
        const { data: allUsers } = await supabase
          .from('users')
          .select('id, email, name')
          .limit(20);
        
        console.log("👥 All users in database:", allUsers);
        
        logger.error("Requester user not found:", { 
          requesterUserId, 
          error: requesterError,
          count 
        });
        throw new Error("User account not found. Please log out and log in again to refresh your session.");
      }

      console.log("✅ User validated successfully");

      // Get owner based on resource type
      let ownerUserId;
      
      switch (resourceType) {
        case "agent": {
          const { data, error } = await supabase
            .from('agents')
            .select('user_id')
            .eq('id', resourceId)
            .single();
          if (error || !data) throw new Error("Resource not found");
          ownerUserId = data.user_id;
          break;
        }
        case "conversation": {
          const { data, error } = await supabase
            .from('conversations')
            .select('user_id')
            .eq('id', resourceId)
            .single();
          if (error || !data) throw new Error("Resource not found");
          ownerUserId = data.user_id;
          break;
        }
        case "task": {
          const { data, error } = await supabase
            .from('collaborative_tasks')
            .select('user_id')
            .eq('id', resourceId)
            .single();
          if (error || !data) throw new Error("Resource not found");
          ownerUserId = data.user_id;
          break;
        }
        case "team": {
          const { data, error } = await supabase
            .from('teams')
            .select('user_id')
            .eq('id', resourceId)
            .single();
          if (error || !data) throw new Error("Resource not found");
          ownerUserId = data.user_id;
          break;
        }
        default:
          throw new Error("Invalid resource type");
      }

      // Check if user is owner
      if (ownerUserId === requesterUserId) {
        throw new Error("Cannot request access to your own resource");
      }

      // Check for existing request
      const { data: existing, error: existError } = await supabase
        .from('share_requests')
        .select('id, status')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .eq('requester_user_id', requesterUserId);

      if (existError) throw existError;

      if (existing && existing.length > 0) {
        if (existing[0].status === "pending") {
          throw new Error("You already have a pending request for this resource");
        }
        if (existing[0].status === "approved") {
          throw new Error("You already have access to this resource");
        }
      }

      // Check if already has access
      const { data: accessCheck, error: accessError } = await supabase
        .from('resource_access')
        .select('id')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .eq('user_id', requesterUserId);

      if (accessError) throw accessError;

      if (accessCheck && accessCheck.length > 0) {
        throw new Error("You already have access to this resource");
      }

      // Create share request
      const insertData = {
        resource_type: resourceType,
        resource_id: resourceId,
        requester_user_id: requesterUserId,
        owner_user_id: ownerUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log("📝 Attempting to insert share request:", insertData);
      
      const { data: result, error: insertError } = await supabase
        .from('share_requests')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      return result;
    } catch (error) {
      logger.error("Create share request error:", error);
      throw error;
    }
  }

  /**
   * Get pending requests for an owner
   */
  async getPendingRequests(ownerUserId: string) {
    try {
      const { data: requests, error } = await supabase
        .from('share_requests')
        .select('*')
        .eq('owner_user_id', ownerUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user info and resource names for each request
      const enrichedRequests = await Promise.all((requests || []).map(async (req) => {
        // Get requester user info
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', req.requester_user_id)
          .single();

        let resourceName = '';
        try {
          switch (req.resource_type) {
            case 'agent': {
              const { data } = await supabase.from('agents').select('name').eq('id', req.resource_id).single();
              resourceName = data?.name || '';
              break;
            }
            case 'conversation': {
              const { data } = await supabase.from('conversations').select('title').eq('id', req.resource_id).single();
              resourceName = data?.title || '';
              break;
            }
            case 'task': {
              const { data } = await supabase.from('collaborative_tasks').select('title').eq('id', req.resource_id).single();
              resourceName = data?.title || '';
              break;
            }
            case 'team': {
              const { data } = await supabase.from('teams').select('name').eq('id', req.resource_id).single();
              resourceName = data?.name || '';
              break;
            }
          }
        } catch (e) {
          // Ignore errors for deleted resources
        }
        
        return {
          ...req,
          requesterName: userData?.name || '',
          requesterEmail: userData?.email || '',
          resourceName
        };
      }));

      return enrichedRequests;
    } catch (error) {
      logger.error("Get pending requests error:", error);
      throw error;
    }
  }

  /**
   * Approve a share request
   */
  async approveRequest(requestId: string, ownerUserId: string) {
    try {
      // Get request details
      const { data: request, error: reqError } = await supabase
        .from('share_requests')
        .select('*')
        .eq('id', requestId)
        .eq('owner_user_id', ownerUserId)
        .single();

      if (reqError || !request) {
        throw new Error("Request not found or you are not authorized");
      }

      if (request.status !== "pending") {
        throw new Error("Request is not pending");
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('share_requests')
        .update({ 
          status: 'approved', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create resource access
      const { error: accessError } = await supabase
        .from('resource_access')
        .insert({
          resource_type: request.resource_type,
          resource_id: request.resource_id,
          user_id: request.requester_user_id,
          role: 'collaborator',
          created_at: new Date().toISOString(),
        });

      if (accessError) throw accessError;

      return { success: true, message: "Request approved" };
    } catch (error) {
      logger.error("Approve request error:", error);
      throw error;
    }
  }

  /**
   * Deny a share request
   */
  async denyRequest(requestId: string, ownerUserId: string) {
    try {
      const { data: request, error: reqError } = await supabase
        .from('share_requests')
        .select('*')
        .eq('id', requestId)
        .eq('owner_user_id', ownerUserId)
        .single();

      if (reqError || !request) {
        throw new Error("Request not found or you are not authorized");
      }

      if (request.status !== "pending") {
        throw new Error("Request is not pending");
      }

      const { error: updateError } = await supabase
        .from('share_requests')
        .update({ 
          status: 'denied', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      return { success: true, message: "Request denied" };
    } catch (error) {
      logger.error("Deny request error:", error);
      throw error;
    }
  }

  /**
   * Toggle resource visibility
   */
  async toggleVisibility(
    resourceType: string,
    resourceId: string,
    userId: string,
    visibility: "public" | "private"
  ) {
    try {
      let error;
      
      switch (resourceType) {
        case "agent": {
          const result = await supabase
            .from('agents')
            .update({ visibility, updated_at: new Date().toISOString() })
            .eq('id', resourceId)
            .eq('user_id', userId);
          error = result.error;
          break;
        }
        case "conversation": {
          const result = await supabase
            .from('conversations')
            .update({ visibility, updated_at: new Date().toISOString() })
            .eq('id', resourceId)
            .eq('user_id', userId);
          error = result.error;
          break;
        }
        case "task": {
          const result = await supabase
            .from('collaborative_tasks')
            .update({ visibility })
            .eq('id', resourceId)
            .eq('user_id', userId);
          error = result.error;
          break;
        }
        case "team": {
          const result = await supabase
            .from('teams')
            .update({ visibility, updated_at: new Date().toISOString() })
            .eq('id', resourceId)
            .eq('user_id', userId);
          error = result.error;
          break;
        }
        default:
          throw new Error("Invalid resource type");
      }

      if (error) throw error;
      
      return { success: true, visibility };
    } catch (error) {
      logger.error("Toggle visibility error:", error);
      throw error;
    }
  }

  /**
   * Check if user has access to a resource
   */
  async checkAccess(
    resourceType: string,
    resourceId: string,
    userId: string
  ): Promise<{ hasAccess: boolean; isOwner: boolean; role?: string }> {
    try {
      // Check ownership
      let ownerUserId;
      
      switch (resourceType) {
        case "agent": {
          const { data } = await supabase
            .from('agents')
            .select('user_id')
            .eq('id', resourceId)
            .single();
          ownerUserId = data?.user_id;
          break;
        }
        case "conversation": {
          const { data } = await supabase
            .from('conversations')
            .select('user_id')
            .eq('id', resourceId)
            .single();
          ownerUserId = data?.user_id;
          break;
        }
        case "task": {
          const { data } = await supabase
            .from('collaborative_tasks')
            .select('user_id')
            .eq('id', resourceId)
            .single();
          ownerUserId = data?.user_id;
          break;
        }
        case "team": {
          const { data } = await supabase
            .from('teams')
            .select('user_id')
            .eq('id', resourceId)
            .single();
          ownerUserId = data?.user_id;
          break;
        }
        default:
          return { hasAccess: false, isOwner: false };
      }

      if (!ownerUserId) {
        return { hasAccess: false, isOwner: false };
      }

      const isOwner = ownerUserId === userId;
      if (isOwner) {
        return { hasAccess: true, isOwner: true, role: "owner" };
      }

      // Check resource access
      const { data: access, error } = await supabase
        .from('resource_access')
        .select('role')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .eq('user_id', userId)
        .single();

      if (!error && access) {
        return { hasAccess: true, isOwner: false, role: access.role };
      }

      return { hasAccess: false, isOwner: false };
    } catch (error) {
      logger.error("Check access error:", error);
      return { hasAccess: false, isOwner: false };
    }
  }

  /**
   * Get shared resources for a user
   */
  async getSharedResources(userId: string) {
    try {
      const { data: sharedResources, error } = await supabase
        .from('resource_access')
        .select('resource_type, resource_id, role, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with resource details
      const enriched = await Promise.all((sharedResources || []).map(async (ra) => {
        let resourceName = '';
        let ownerId = '';
        let ownerName = '';
        let teamId = null;
        
        try {
          switch (ra.resource_type) {
            case 'agent': {
              const { data } = await supabase
                .from('agents')
                .select('name, user_id, users!agents_user_id_fkey(name)')
                .eq('id', ra.resource_id)
                .single();
              resourceName = data?.name || '';
              ownerId = data?.user_id || '';
              ownerName = data?.users?.name || '';
              break;
            }
            case 'conversation': {
              const { data } = await supabase
                .from('conversations')
                .select('title, user_id, users!conversations_user_id_fkey(name)')
                .eq('id', ra.resource_id)
                .single();
              resourceName = data?.title || '';
              ownerId = data?.user_id || '';
              ownerName = data?.users?.name || '';
              break;
            }
            case 'task': {
              const { data } = await supabase
                .from('collaborative_tasks')
                .select('title, user_id, team_id, users!collaborative_tasks_user_id_fkey(name)')
                .eq('id', ra.resource_id)
                .single();
              resourceName = data?.title || '';
              ownerId = data?.user_id || '';
              ownerName = data?.users?.name || '';
              teamId = data?.team_id || null;
              break;
            }
            case 'team': {
              const { data } = await supabase
                .from('teams')
                .select('name, user_id, users!teams_user_id_fkey(name)')
                .eq('id', ra.resource_id)
                .single();
              resourceName = data?.name || '';
              ownerId = data?.user_id || '';
              ownerName = data?.users?.name || '';
              break;
            }
          }
        } catch (e) {
          // Resource might have been deleted
        }

        return {
          resourceType: ra.resource_type,
          resourceId: ra.resource_id,
          role: ra.role,
          createdAt: ra.created_at,
          resourceName,
          teamId,
          ownerId,
          ownerName
        };
      }));

      return enriched;
    } catch (error) {
      logger.error("Get shared resources error:", error);
      throw error;
    }
  }
}

export const shareService = new ShareService();
