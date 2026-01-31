import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type FeedbackType = {
  id: number;
  category: string;
  status: 'new' | 'reviewed';
};

type FeedbackChartProps = {
  feedbacks: FeedbackType[];
};

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#9C27B0']; // Bug, Feature, UI, Other

export default function FeedbackChart({ feedbacks }: FeedbackChartProps) {
  const categoryData = ['bug', 'feature', 'ui', 'other'].map((cat, i) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: feedbacks.filter(f => f.category === cat).length,
    color: COLORS[i],
  }));

  const totalFeedbacks = feedbacks.length;
  const newCount = feedbacks.filter(f => f.status === 'new').length;
  const reviewedCount = feedbacks.filter(f => f.status === 'reviewed').length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
        Feedback Analytics
      </h2>

      <div className="flex flex-col sm:flex-row gap-6 items-center justify-around">
        {/* Summary */}
        <div className="flex flex-col gap-2 text-gray-700 dark:text-gray-300">
          <p className="text-lg">
            <span className="font-semibold">{totalFeedbacks}</span> Total Feedbacks
          </p>
          <p className="text-lg">
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">{newCount}</span> New
          </p>
          <p className="text-lg">
            <span className="font-semibold text-green-600 dark:text-green-400">{reviewedCount}</span> Reviewed
          </p>
        </div>

        {/* Pie Chart */}
        <div className="w-full sm:w-[400px] h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry.name} (${entry.value})`}
              >
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value}`, `${name}`]}
                contentStyle={{ backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: '0.9rem', color: '#4B5563' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}