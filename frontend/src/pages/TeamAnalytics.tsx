import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, CheckCircle, Clock, Target, TrendingUp, ThumbsUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function TeamAnalytics() {
  const [live, setLive] = useState(true);
  const [intervalMs, setIntervalMs] = useState(5000);

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['teamAnalytics'],
    queryFn: async () => {
      const response = await api.get('/analytics/teams');
      return response.data?.data;
    },
    refetchInterval: live ? intervalMs : false,
    retry: 2,
  });

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/analytics')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analytics
        </button>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Team Collaboration Analytics</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-base">
          <label className="text-sm sm:text-base text-gray-600">Live updates</label>
          <button
            onClick={() => setLive((s) => !s)}
            className={`px-2 sm:px-3 py-1 rounded text-sm sm:text-base ${live ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
            {live ? 'On' : 'Off'}
          </button>
          <label className="text-sm sm:text-base text-gray-600">Interval (ms)</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-20 sm:w-28 text-base"
            value={intervalMs}
            onChange={(e) => setIntervalMs(Math.max(1000, Number(e.target.value) || 1000))}
          />
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-2xl text-gray-600">Loading team analytics...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-2xl text-red-600">{(error as any).message || 'Failed to load team analytics'}</div>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base text-gray-600">Total Teams</p>
                  <p className="text-3xl font-semibold">{data?.overview?.totalTeams || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base text-gray-600">Active Teams</p>
                  <p className="text-3xl font-semibold">{data?.overview?.activeTeams || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base text-gray-600">Total Tasks</p>
                  <p className="text-3xl font-semibold">{data?.overview?.totalTasks || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base text-gray-600">Completed</p>
                  <p className="text-3xl font-semibold">{data?.overview?.completedTasks || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                  <ThumbsUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base text-gray-600">Success Rate</p>
                  <p className="text-3xl font-semibold">{data?.overview?.successRate || 0}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base text-gray-600">Avg. Time</p>
                  <p className="text-3xl font-semibold">{data?.overview?.avgCompletionTime || 0}m</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base text-gray-600">Total Agents</p>
                  <p className="text-3xl font-semibold">{data?.overview?.totalAgents || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Tasks Over Time */}
            {data?.tasksOverTime && data.tasksOverTime.length > 0 && (
              <div className="bg-white rounded-lg shadow border p-6">
                <h2 className="text-xl font-semibold mb-4">Tasks Over Time</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.tasksOverTime}>
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
                    <Legend />
                    <Bar dataKey="tasks" fill="#3b82f6" name="Total Tasks" />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Task Status Distribution */}
            {data?.taskStatusDistribution && data.taskStatusDistribution.length > 0 && (
              <div className="bg-white rounded-lg shadow border p-6">
                <h2 className="text-xl font-semibold mb-4">Task Status Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.taskStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.taskStatusDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Team Performance Table */}
          {data?.teamPerformance && data.teamPerformance.length > 0 && (
            <div className="bg-white rounded-lg shadow border p-6">
              <h2 className="text-xl font-semibold mb-4">Team Performance</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Members</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Total Tasks</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.teamPerformance.map((team: any) => (
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">{team.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">{team.members}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">{team.totalTasks}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-green-600 font-medium">{team.completedTasks}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">{team.pendingTasks}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-blue-600">{team.inProgressTasks}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-sm font-medium rounded ${
                            team.successRate >= 80 ? 'bg-green-100 text-green-800' :
                            team.successRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {team.successRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
