import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users } from 'lucide-react';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import api from '../services/api';

export default function Analytics() {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agentId') || undefined;
  const [live, setLive] = useState(true);
  const [intervalMs, setIntervalMs] = useState(5000);

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['analytics', agentId],
    queryFn: async () => {
      const response = agentId
        ? await api.get(`/analytics/agent/${agentId}`)
        : await api.get('/analytics');
      return response.data?.data;
    },
    // If live updates enabled, refetch every intervalMs ms; otherwise don't auto-refetch
    refetchInterval: live ? intervalMs : false,
  // keepPreviousData removed for compatibility with the project's react-query types
    // retry a couple of times on transient errors
    retry: 2,
  });

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics Dashboard</h1>
          <button
            onClick={() => navigate('/team-analytics')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-base"
          >
            <Users className="h-4 w-4" />
            Teams Analytics
          </button>
        </div>
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
          <div className="text-2xl text-gray-600">Loading analytics...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-2xl text-red-600">{(error as any).message || 'Failed to load analytics'}</div>
        </div>
      ) : (
        <AnalyticsDashboard data={data as any} />
      )}
    </div>
  );
}