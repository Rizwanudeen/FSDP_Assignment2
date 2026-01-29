// src/routes/analyticsRoutes.ts

import express from "express";
import { db, supabase } from "../config/database";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

/**
 * GET /api/analytics
 *
 * Returns:
 *  Overview:
 *   - totalAgents
 *   - activeAgents
 *   - totalConversations
 *   - avgResponseTime
 *   - avgSuccessRate
 *
 *  agentPerformance[]:
 *   - id
 *   - name
 *   - conversations
 *   - interactions
 *   - successRate
 *   - responseTime
 *   - tokensUsed
 *   - llmCostUSD
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // ================================================
    // 🔥 1. FETCH AGENTS
    // ================================================
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (agentsError) throw agentsError;

    if (!agents.length) {
      return res.json({
        success: true,
        data: {
          overview: {
            totalAgents: 0,
            activeAgents: 0,
            totalConversations: 0,
            avgResponseTime: 0,
            avgSuccessRate: 0,
          },
          agentPerformance: [],
        },
      });
    }

    // ================================================
    // 🔥 2. FETCH CONVERSATION COUNTS (super fast)
    // ================================================
    const agentIds = agents?.map(a => a.id) || [];
    const { data: conversationCounts, error: countError } = await supabase
      .from('conversations')
      .select('agent_id')
      .in('agent_id', agentIds);

    if (countError) throw countError;

    const countsByAgent = conversationCounts?.reduce((acc: any, conv: any) => {
      acc[conv.agent_id] = (acc[conv.agent_id] || 0) + 1;
      return acc;
    }, {}) || {};

    const conversationCountsFormatted = Object.entries(countsByAgent).map(([agentId, count]) => ({
      agentId,
      count
    }));

    // Convert to dictionary: { agentId: count }
    const countMap = Object.fromEntries(
      conversationCountsFormatted.map((c: any) => [c.agentId, c.count])
    );

    // ================================================
    // 🔥 3. CALCULATE REAL METRICS FROM DATABASE
    // ================================================
    // Get message counts per agent for interactions
    const { data: messageCounts, error: msgCountError } = await supabase
      .from('messages')
      .select('conversations!inner(agent_id)')
      .in('conversations.agent_id', agentIds);

    if (msgCountError) throw msgCountError;

    const interactionsByAgent = messageCounts?.reduce((acc: any, msg: any) => {
      const agentId = msg.conversations.agent_id;
      acc[agentId] = (acc[agentId] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calculate real-time success rates per agent from feedback
    const { data: feedbackByAgent, error: feedbackError } = await supabase
      .from('messages')
      .select('feedback, conversations!inner(agent_id)')
      .in('conversations.agent_id', agentIds)
      .in('feedback', [1, -1]);

    if (feedbackError) throw feedbackError;

    const successRateByAgent: { [key: string]: number } = {};
    const feedbackCounts: { [key: string]: { positive: number, negative: number } } = {};

    feedbackByAgent?.forEach((msg: any) => {
      const agentId = msg.conversations.agent_id;
      if (!feedbackCounts[agentId]) {
        feedbackCounts[agentId] = { positive: 0, negative: 0 };
      }
      if (msg.feedback === 1) {
        feedbackCounts[agentId].positive++;
      } else if (msg.feedback === -1) {
        feedbackCounts[agentId].negative++;
      }
    });

    // Calculate success rate percentage for each agent
    Object.keys(feedbackCounts).forEach(agentId => {
      const { positive, negative } = feedbackCounts[agentId];
      const total = positive + negative;
      successRateByAgent[agentId] = total > 0 ? Math.round((positive / total) * 100) : 0;
    });

    // ================================================
    // 🔥 4. BUILD ENRICHED AGENT LIST
    // ================================================
    const enrichedAgents = (agents || []).map((a) => {
      let metrics: any = {};

      try {
        // Handle both JSON string and object formats
        if (typeof a.metrics === 'string') {
          metrics = JSON.parse(a.metrics);
        } else if (typeof a.metrics === 'object' && a.metrics !== null) {
          metrics = a.metrics;
        }
      } catch {
        metrics = {};
      }

      return {
        ...a,
        metrics: {
          totalInteractions: interactionsByAgent[a.id] || 0, // Real count from DB
          successRate: successRateByAgent[a.id] ?? 0, // Real-time success rate
          avgResponseTime: metrics.avgResponseTime || 0,
          totalTokens: metrics.totalTokens || 0,
          llmCostUSD: metrics.llmCostUSD || 0,
        },
        conversations: countMap[a.id] || 0,
      };
    });

    // ================================================
    // 🔥 5. COMPUTE OVERVIEW ANALYTICS
    // ================================================
    const totalAgents = enrichedAgents.length;
    const activeAgents = enrichedAgents.filter((a) => a.status === "ACTIVE")
      .length;
    const totalConversations = enrichedAgents.reduce(
      (sum, a) => sum + a.conversations,
      0
    );

    const avgResponseTime =
      enrichedAgents.reduce(
        (sum, a) => sum + (a.metrics.avgResponseTime || 0),
        0
      ) / (totalAgents || 1);

    // Calculate success rate from actual feedback data
    const { data: allMessages, error: msgError } = await supabase
      .from('messages')
      .select('feedback, conversations!inner(agent_id)')
      .in('conversations.agent_id', agentIds)
      .not('feedback', 'is', null);

    if (msgError) throw msgError;

    const feedbackStats = [{
      positive: allMessages?.filter(m => m.feedback === 1).length || 0,
      negative: allMessages?.filter(m => m.feedback === -1).length || 0
    }];

    const totalFeedback = (feedbackStats[0]?.positive || 0) + (feedbackStats[0]?.negative || 0);
    const avgSuccessRate = totalFeedback > 0 
      ? Math.round(((feedbackStats[0]?.positive || 0) / totalFeedback) * 100)
      : 0;

    // ================================================
    // 🔥 6. AGENT PERFORMANCE TABLE
    // ================================================
    const agentPerformance = enrichedAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      interactions: agent.metrics.totalInteractions,
      successRate: agent.metrics.successRate,
      responseTime: agent.metrics.avgResponseTime,
      conversations: agent.conversations,
      tokensUsed: agent.metrics.totalTokens,
      llmCostUSD: agent.metrics.llmCostUSD,
    }));

    // ================================================
    // 🔥 7. TIME-SERIES DATA FOR CHARTS
    // ================================================
    // Get interactions over time (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentMessages, error: recentError } = await supabase
      .from('messages')
      .select('created_at, conversations!inner(agent_id)')
      .in('conversations.agent_id', agentIds)
      .gte('created_at', sevenDaysAgo);

    if (recentError) throw recentError;

    const interactionsByDate = recentMessages?.reduce((acc: any, msg: any) => {
      const date = msg.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    const interactionsOverTime = Object.entries(interactionsByDate)
      .map(([date, interactions]) => ({ date, interactions }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get success rate trend (last 7 days)
    const { data: feedbackMessages, error: feedbackMsgError } = await supabase
      .from('messages')
      .select('created_at, feedback, conversations!inner(agent_id)')
      .in('conversations.agent_id', agentIds)
      .gte('created_at', sevenDaysAgo)
      .in('feedback', [1, -1]);

    if (feedbackMsgError) throw feedbackMsgError;

    const feedbackByDate = feedbackMessages?.reduce((acc: any, msg: any) => {
      const date = msg.created_at.split('T')[0];
      if (!acc[date]) acc[date] = { positive: 0, total: 0 };
      if (msg.feedback === 1) acc[date].positive++;
      acc[date].total++;
      return acc;
    }, {}) || {};

    const successRateTrend = Object.entries(feedbackByDate)
      .map(([date, stats]: [string, any]) => ({
        date,
        successRate: Math.round((stats.positive / stats.total) * 100)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ================================================
    // 🔥 7. RETURN RESPONSE
    // ================================================
    res.json({
      success: true,
      data: {
        overview: {
          totalAgents,
          activeAgents,
          totalConversations,
          avgResponseTime,
          avgSuccessRate,
        },
        agentPerformance,
        interactionsOverTime: interactionsOverTime.map(row => ({
          date: row.date,
          interactions: row.interactions
        })),
        successRateTrend: successRateTrend.map(row => ({
          date: row.date,
          successRate: row.successRate
        })),
      },
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics",
    });
  }
});

/**
 * GET /api/analytics/agent/:agentId
 *
 * Fetches detailed analytics for a single agent.
 */
router.get("/agent/:agentId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { agentId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // ================================================
    // 🔥 1. FETCH AGENT
    // ================================================
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (agentError) throw agentError;

    if (!agent.length) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    // ================================================
    // 🔥 2. FETCH CONVERSATIONS & METRICS
    // ================================================
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('agent_id', agentId);

    if (convError) throw convError;

    let metrics: any = {};
    try {
      // Handle both JSON string and object formats
      if (typeof agent[0].metrics === 'string') {
        metrics = JSON.parse(agent[0].metrics);
      } else if (typeof agent[0].metrics === 'object' && agent[0].metrics !== null) {
        metrics = agent[0].metrics;
      }
    } catch {
      metrics = {};
    }

    const enrichedAgent = {
      ...agent[0],
      metrics: {
        totalInteractions: metrics.totalInteractions || 0,
        totalTokens: metrics.totalTokens || 0,
        avgResponseTime: metrics.avgResponseTime || 0,
        successRate: metrics.successRate || 0,
        llmCost: metrics.llmCost || 0,
      },
      conversations: conversations.length,
    };

    // ================================================
    // 🔥 3. CALCULATE OVERVIEW
    // ================================================
    const overview = {
      totalAgents: 1,
      activeAgents: 1,
      totalConversations: conversations.length,
      avgResponseTime: enrichedAgent.metrics.avgResponseTime,
      avgSuccessRate: enrichedAgent.metrics.successRate,
    };

    res.json({
      success: true,
      data: {
        overview,
        agentPerformance: [enrichedAgent],
        conversations, // Also pass conversation details
      },
    });
  } catch (error) {
    console.error(`Error fetching analytics for agent ${req.params.agentId}:`, error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

/**
 * GET /api/analytics/teams
 * 
 * Returns analytics specific to teams collaboration:
 * - Total teams
 * - Active teams
 * - Total collaborative tasks
 * - Average task completion time
 * - Team performance metrics
 * - Task execution trends over time
 */
router.get("/teams", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // ================================================
    // 🔥 1. FETCH TEAMS FOR USER
    // ================================================
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*, team_members(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (teamsError) throw teamsError;

    const teams = teamsData?.map(t => ({
      ...t,
      memberCount: t.team_members?.[0]?.count || 0
    })) || [];

    if (!teams.length) {
      return res.json({
        success: true,
        data: {
          overview: {
            totalTeams: 0,
            activeTeams: 0,
            totalTasks: 0,
            completedTasks: 0,
            avgCompletionTime: 0,
            totalAgents: 0,
          },
          teamPerformance: [],
          tasksOverTime: [],
          taskStatusDistribution: [],
        },
      });
    }

    const teamIds = teams.map(t => t.id);

    // ================================================
    // 🔥 2. FETCH TASKS FOR TEAMS
    // ================================================
    const { data: tasks, error: tasksError } = await supabase
      .from('collaborative_tasks')
      .select('*')
      .in('team_id', teamIds);

    if (tasksError) throw tasksError;

    // ================================================
    // 🔥 3. CALCULATE OVERVIEW METRICS
    // ================================================
    const totalTeams = teams.length;
    const activeTeams = teams.filter(t => {
      // Consider team active if it has tasks created in the last 30 days
      const hasRecentTasks = (tasks || []).some((task: any) => 
        task.team_id === t.id && 
        new Date(task.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      return hasRecentTasks;
    }).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    
    // Calculate average completion time for completed tasks
    const completedTasksWithTime = tasks.filter(t => 
      t.status === 'COMPLETED' && t.completed_at && t.created_at
    );
    
    let avgCompletionTime = 0;
    if (completedTasksWithTime.length > 0) {
      const totalTime = completedTasksWithTime.reduce((sum, task) => {
        const created = new Date(task.created_at).getTime();
        const completed = new Date(task.completed_at).getTime();
        return sum + (completed - created);
      }, 0);
      avgCompletionTime = Math.round(totalTime / completedTasksWithTime.length / (1000 * 60)); // Convert to minutes
    }

    // Get total unique agents across all teams
    const { data: allAgents, error: agentsError } = await supabase
      .from('team_members')
      .select('agent_id')
      .in('team_id', teamIds);

    if (agentsError) throw agentsError;

    const uniqueAgentIds = [...new Set(allAgents?.map(a => a.agent_id) || [])];
    const allAgentsFormatted = uniqueAgentIds.map(id => ({ agentId: id }));
    const totalAgents = allAgentsFormatted.length;

    // Calculate overall success rate based on task feedback
    const taskFeedbackStats = [{
      positive: tasks?.filter((t: any) => t.feedback === 1).length || 0,
      negative: tasks?.filter((t: any) => t.feedback === -1).length || 0
    }];

    const totalTaskFeedback = (taskFeedbackStats[0]?.positive || 0) + (taskFeedbackStats[0]?.negative || 0);
    const overallSuccessRate = totalTaskFeedback > 0 
      ? Math.round(((taskFeedbackStats[0]?.positive || 0) / totalTaskFeedback) * 100)
      : 0;

    // ================================================
    // 🔥 4. TEAM PERFORMANCE METRICS
    // ================================================
    const teamPerformance = teams.map(team => {
      const teamTasks = (tasks || []).filter((t: any) => t.team_id === team.id);
      const teamCompletedTasks = teamTasks.filter((t: any) => t.status === 'COMPLETED');
      
      // Calculate success rate based on feedback for this team
      const teamTasksWithFeedback = teamTasks.filter(t => t.feedback !== null && t.feedback !== 0);
      const teamPositiveFeedback = teamTasks.filter(t => t.feedback === 1).length;
      const successRate = teamTasksWithFeedback.length > 0
        ? Math.round((teamPositiveFeedback / teamTasksWithFeedback.length) * 100)
        : 0;

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        members: team.memberCount,
        totalTasks: teamTasks.length,
        completedTasks: teamCompletedTasks.length,
        pendingTasks: teamTasks.filter((t: any) => t.status === 'PENDING').length,
        inProgressTasks: teamTasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        successRate,
      };
    });

    // ================================================
    // 🔥 5. TASKS OVER TIME (last 7 days)
    // ================================================
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentTasks = tasks?.filter((t: any) => new Date(t.created_at) >= new Date(sevenDaysAgo)) || [];

    const tasksByDate = recentTasks.reduce((acc: any, task: any) => {
      const date = task.created_at.split('T')[0];
      if (!acc[date]) acc[date] = { tasks: 0, completed: 0 };
      acc[date].tasks++;
      if (task.status === 'COMPLETED') acc[date].completed++;
      return acc;
    }, {});

    const tasksOverTime = Object.entries(tasksByDate)
      .map(([date, stats]: [string, any]) => ({ date, tasks: stats.tasks, completed: stats.completed }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ================================================
    // 🔥 6. TASK STATUS DISTRIBUTION
    // ================================================
    const statusCounts = {
      PENDING: tasks.filter(t => t.status === 'PENDING').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
      FAILED: tasks.filter(t => t.status === 'FAILED').length,
    };

    const taskStatusDistribution = Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    // ================================================
    // 🔥 7. RETURN RESPONSE
    // ================================================
    res.json({
      success: true,
      data: {
        overview: {
          totalTeams,
          activeTeams,
          totalTasks,
          completedTasks,
          avgCompletionTime,
          totalAgents,
          successRate: overallSuccessRate,
        },
        teamPerformance,
        tasksOverTime: tasksOverTime.map(row => ({
          date: row.date,
          tasks: row.tasks,
          completed: row.completed,
        })),
        taskStatusDistribution,
      },
    });

  } catch (error) {
    console.error("Teams Analytics Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch teams analytics",
    });
  }
});

export { router as analyticsRoutes };
