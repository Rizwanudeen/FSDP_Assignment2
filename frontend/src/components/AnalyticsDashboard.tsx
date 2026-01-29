import { BarChart2, Bot, Cpu, Users, Clock } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Props = {
  data: {
    overview: {
      totalAgents: number;
      activeAgents: number;
      totalConversations: number;
      avgResponseTime: number;
      avgSuccessRate: number;
      totalInteractions?: number;
    };
    agentPerformance: Array<{
      id: string;
      name: string;
      interactions: number;
      successRate: number;
      responseTime: number;
      type?: string;
    }>;
    interactionsOverTime?: Array<{
      date: string;
      interactions: number;
    }>;
    successRateTrend?: Array<{
      date: string;
      successRate: number;
    }>;
  };
};

// Helper function to get agent type distribution from real data
const getAgentTypeDistribution = (agents: Props['data']['agentPerformance']) => {
  const typeCounts: { [key: string]: number } = {};
  
  agents.forEach(agent => {
    const type = agent.type || 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  return Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value
  }));
};

const COLORS = ['#3b82f6', '#a855f7', '#ec4899', '#f97316'];

export default function AnalyticsDashboard({ data }: Props) {
  const { overview } = data;
  const stats = [
    {
      name: 'Total Agents',
      value: overview.totalAgents,
      icon: Bot,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      name: 'Active Agents',
      value: overview.activeAgents,
      icon: Cpu,
      color: 'bg-green-100 text-green-600',
    },
    {
      name: 'Success Rate',
      value: `${Math.round(overview.avgSuccessRate)}%`,
      icon: BarChart2,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      name: 'Response Time',
      value: `${Math.round(overview.avgResponseTime)}ms`,
      icon: Clock,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      name: 'Total Conversations Started',
      value: overview.totalConversations.toLocaleString(),
      icon: Users,
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base text-gray-600">{stat.name}</p>
                <p className="text-3xl font-semibold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Interactions Over Time - Area Chart */}
        {data.interactionsOverTime && data.interactionsOverTime.length > 0 && (
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-xl font-semibold mb-4">Interactions Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.interactionsOverTime}>
                <defs>
                  <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#colorInteractions)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Agent Type Distribution - Pie Chart */}
        {data.agentPerformance && data.agentPerformance.length > 0 && (
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-xl font-semibold mb-4">Agent Type Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getAgentTypeDistribution(data.agentPerformance)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getAgentTypeDistribution(data.agentPerformance).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Success Rate Trend - Line Chart */}
      {data.successRateTrend && data.successRateTrend.length > 0 && (
        <div className="bg-white rounded-lg shadow border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Success Rate Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.successRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => [`${value}%`, 'Success Rate']}
              />
              <Line 
                type="monotone" 
                dataKey="successRate" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Agent Performance Table */}
      {data.agentPerformance && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-4">Agent Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Interactions</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.agentPerformance.map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">{agent.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">{(agent.interactions || (agent as any).metrics?.totalInteractions || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">{agent.successRate || (agent as any).metrics?.successRate || 0}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">{Math.round(agent.responseTime || (agent as any).metrics?.avgResponseTime || 0)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
