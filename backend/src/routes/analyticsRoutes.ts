// src/routes/analyticsRoutes.ts

import express from "express";
import { supabase } from "../config/database.js"; // Updated import
import { authenticateToken } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/**
 * GET /api/analytics
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // ================================================
    // 1. FETCH AGENTS
    // ================================================
    const { data: agents, error: agentsErr } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (agentsErr) throw agentsErr;

    if (!agents || agents.length === 0) {
      return res.json({
        success: true,
        data: {
          overview: { totalAgents: 0, activeAgents: 0, totalConversations: 0, avgResponseTime: 0, avgSuccessRate: 0 },
          agentPerformance: [],
        },
      });
    }

    // ================================================
    // 2. FETCH CONVERSATION COUNTS
    // ================================================
    // We fetch agent_ids for all conversations belonging to this user
    const { data: convData, error: convErr } = await supabase
      .from('conversations')
      .select('agent_id')
      .eq('user_id', userId);

    if (convErr) throw convErr;

    const countMap: Record<string, number> = {};
    convData?.forEach(c => {
      countMap[c.agent_id] = (countMap[c.agent_id] || 0) + 1;
    });

    // Get agent IDs for filtering
    const agentIds = agents.map(a => a.id);

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
    let totalInteractions = 0;
    let sumResponseTime = 0;
    let activeAgentsCount = 0;

    const agentPerformance = agents.map((a) => {
      // Postgres JSONB is already an object, no JSON.parse needed
      const m = a.metrics || {};
      const conversations = countMap[a.id] || 0;

      if (a.status === "ACTIVE") activeAgentsCount++;
      sumResponseTime += (m.avgResponseTime || 0);
      totalInteractions += (m.totalInteractions || 0);

      return {
        id: a.id,
        name: a.name,
        type: a.type,
        interactions: m.totalInteractions || 0,
        successRate: m.successRate || 0,
        responseTime: m.avgResponseTime || 0,
        conversations: conversations,
        tokensUsed: m.totalTokens || 0,
        llmCostUSD: m.llmCostUSD || 0,
      };
    });

    // ================================================
    // 4. FETCH FEEDBACK STATS (Messages join Conversations)
    // ================================================
    const { data: feedbackData, error: feedErr } = await supabase
      .from('messages')
      .select('feedback, conversations!inner(user_id)')
      .eq('conversations.user_id', userId)
      .neq('feedback', 0); // Only count 1 or -1

    if (feedErr) throw feedErr;

    const positive = feedbackData?.filter(m => m.feedback === 1).length || 0;
    const totalFeedback = feedbackData?.length || 0;
    const avgSuccessRate = totalFeedback > 0 ? Math.round((positive / totalFeedback) * 100) : 0;

    // ================================================
    // 5. TIME-SERIES DATA (Last 7 Days)
    // ================================================
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentMessages, error: msgErr } = await supabase
      .from('messages')
      .select('created_at, feedback, conversations!inner(user_id)')
      .eq('conversations.user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (msgErr) throw msgErr;

    // Grouping logic in JS (Replacement for SQL GROUP BY DATE)
    const dailyInteractions: Record<string, number> = {};
    const dailySuccess: Record<string, { pos: number; tot: number }> = {};

    recentMessages?.forEach(m => {
      const date = new Date(m.created_at).toISOString().split('T')[0];
      
      // Interactions trend
      dailyInteractions[date] = (dailyInteractions[date] || 0) + 1;

      // Success rate trend
      if (m.feedback !== 0) {
        if (!dailySuccess[date]) dailySuccess[date] = { pos: 0, tot: 0 };
        if (m.feedback === 1) dailySuccess[date].pos++;
        dailySuccess[date].tot++;
      }
    });

    // ================================================
    // 6. RETURN RESPONSE
    // ================================================
    res.json({
      success: true,
      data: {
        overview: {
          totalAgents: agents.length,
          activeAgents: activeAgentsCount,
          totalConversations: convData?.length || 0,
          avgResponseTime: sumResponseTime / (agents.length || 1),
          avgSuccessRate,
        },
        agentPerformance,
        interactionsOverTime: Object.entries(dailyInteractions).map(([date, count]) => ({
          date,
          interactions: count
        })).sort((a,b) => a.date.localeCompare(b.date)),
        successRateTrend: Object.entries(dailySuccess).map(([date, stats]) => ({
          date,
          successRate: Math.round((stats.pos / stats.tot) * 100)
        })).sort((a,b) => a.date.localeCompare(b.date)),
      },
    });

  } catch (error) {
    logger.error("Analytics Global Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
});

/**
 * GET /api/analytics/agent/:agentId
 */
router.get("/agent/:agentId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { agentId } = req.params;

    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    // 1. Fetch Agent
    const { data: agent, error: agentErr } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (agentErr || !agent) return res.status(404).json({ success: false, error: "Agent not found" });

    // 2. Fetch Conversations for this specific agent
    const { data: conversations, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .eq('agent_id', agentId);

    if (convErr) throw convErr;

    const m = agent.metrics || {};
    
    res.json({
      success: true,
      data: {
        overview: {
          totalAgents: 1,
          activeAgents: agent.status === 'ACTIVE' ? 1 : 0,
          totalConversations: conversations.length,
          avgResponseTime: m.avgResponseTime || 0,
          avgSuccessRate: m.successRate || 0,
        },
        agentPerformance: [{
          ...agent,
          metrics: m,
          conversations: conversations.length
        }],
        conversations,
      },
    });
  } catch (error) {
    logger.error(`Error fetching individual agent analytics:`, error);
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
        task.teamId === t.id && 
        new Date(task.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      return hasRecentTasks;
    }).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    
    // Calculate average completion time for completed tasks
    const completedTasksWithTime = tasks.filter(t => 
      t.status === 'COMPLETED' && t.completedAt && t.createdAt
    );
    
    let avgCompletionTime = 0;
    if (completedTasksWithTime.length > 0) {
      const totalTime = completedTasksWithTime.reduce((sum, task) => {
        const created = new Date(task.createdAt).getTime();
        const completed = new Date(task.completedAt).getTime();
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