import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import FeedbackChart from './FeedbackChart';

type FeedbackType = {
  id: number;
  category: string;
  message: string;
  status: 'new' | 'reviewed';
  date: string;
};

export default function AdminFeedback() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const feedbacksPerPage = 5;

  // Load feedbacks and mock if empty
  const loadFeedbacks = () => {
    const saved = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    if (saved.length === 0) {
      const mockFeedbacks: FeedbackType[] = [
        { id: 1, category: 'bug', message: 'Submit button not responsive', status: 'new', date: new Date().toLocaleString() },
        { id: 2, category: 'feature', message: 'Add dark mode', status: 'reviewed', date: new Date().toLocaleString() },
        { id: 3, category: 'ui', message: 'Profile page crowded', status: 'new', date: new Date().toLocaleString() },
        { id: 4, category: 'bug', message: 'Notifications not updating in real-time', status: 'new', date: new Date().toLocaleString() },
        { id: 5, category: 'feature', message: 'Ability to export feedback as CSV', status: 'reviewed', date: new Date().toLocaleString() },
        { id: 6, category: 'ui', message: 'Buttons misaligned on mobile', status: 'new', date: new Date().toLocaleString() },
        { id: 7, category: 'other', message: 'App crashes after long session', status: 'new', date: new Date().toLocaleString() },
        { id: 8, category: 'bug', message: 'Error 500 on login', status: 'reviewed', date: new Date().toLocaleString() },
        { id: 9, category: 'feature', message: 'Add multi-language support', status: 'new', date: new Date().toLocaleString() },
        { id: 10, category: 'ui', message: 'Text overlaps on profile card', status: 'new', date: new Date().toLocaleString() },
        { id: 11, category: 'other', message: 'Feedback form unclear', status: 'reviewed', date: new Date().toLocaleString() },
      ];
      localStorage.setItem('feedbacks', JSON.stringify(mockFeedbacks));
      setFeedbacks(mockFeedbacks);
    } else {
      setFeedbacks(saved);
    }
  };

  useEffect(() => {
    loadFeedbacks();
    const interval = setInterval(loadFeedbacks, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  const markReviewed = (id: number) => {
    setFeedbacks(prev =>
      prev.map(f => (f.id === id ? { ...f, status: 'reviewed' } : f))
    );
    setToastMessage('✅ Feedback marked as reviewed');
    setShowToast(true);
  };

  const deleteFeedback = (id: number) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id));
    setToastMessage('🗑 Feedback deleted');
    setShowToast(true);
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  // Bulk actions
  const markSelectedReviewed = () => {
    setFeedbacks(prev =>
      prev.map(f => selectedIds.includes(f.id) ? { ...f, status: 'reviewed' } : f)
    );
    setToastMessage(`✅ ${selectedIds.length} feedback(s) marked as reviewed`);
    setShowToast(true);
    setSelectedIds([]);
  };

  const deleteSelected = () => {
    setFeedbacks(prev => prev.filter(f => !selectedIds.includes(f.id)));
    setToastMessage(`🗑 ${selectedIds.length} feedback(s) deleted`);
    setShowToast(true);
    setSelectedIds([]);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Category', 'Message', 'Status', 'Date'];
    const rows = filteredFeedbacks.map(f => [f.id, f.category, f.message, f.status, f.date]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feedbacks.csv';
    link.click();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allIds = paginatedFeedbacks.map(f => f.id);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : allIds);
  };

  const filteredFeedbacks = feedbacks
    .filter(f =>
      (filterCategory === 'all' || f.category === filterCategory) &&
      f.message.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filteredFeedbacks.length / feedbacksPerPage);
  const paginatedFeedbacks = filteredFeedbacks.slice(
    (currentPage - 1) * feedbacksPerPage,
    currentPage * feedbacksPerPage
  );

  const goNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goPrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Admin Feedback</h1>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search messages..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full sm:w-1/2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">All Categories</option>
          <option value="bug">Bug / Issue</option>
          <option value="feature">Feature Request</option>
          <option value="ui">UI / UX</option>
          <option value="other">Other</option>
        </select>
        <button onClick={markSelectedReviewed} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50" disabled={selectedIds.length === 0}>
          Mark Selected as Reviewed
        </button>
        <button onClick={deleteSelected} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50" disabled={selectedIds.length === 0}>
          Delete Selected
        </button>
        <button onClick={exportCSV} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-1">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Chart Section */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <FeedbackChart feedbacks={filteredFeedbacks} />
      </div>

      {/* Feedback Table */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {filteredFeedbacks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">No feedback submitted yet.</p>
        ) : (
          <>
            <table className="w-full text-left border-collapse bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="p-3 border-b border-gray-300 dark:border-gray-600">
                    <input type="checkbox" checked={paginatedFeedbacks.length > 0 && paginatedFeedbacks.every(f => selectedIds.includes(f.id))} onChange={toggleSelectAll} />
                  </th>
                  <th className="p-3 border-b border-gray-300 dark:border-gray-600">#</th>
                  <th className="p-3 border-b border-gray-300 dark:border-gray-600">Category</th>
                  <th className="p-3 border-b border-gray-300 dark:border-gray-600">Message</th>
                  <th className="p-3 border-b border-gray-300 dark:border-gray-600">Status</th>
                  <th className="p-3 border-b border-gray-300 dark:border-gray-600">Date</th>
                  <th className="p-3 border-b border-gray-300 dark:border-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFeedbacks.map((f, i) => (
                  <tr key={f.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedIds.includes(f.id)} onChange={() => toggleSelect(f.id)} />
                    </td>
                    <td className="p-3">{(currentPage - 1) * feedbacksPerPage + i + 1}</td>
                    <td className="p-3 capitalize">{f.category}</td>
                    <td className="p-3">{f.message}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${f.status === 'new' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' : 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-3">{f.date}</td>
                    <td className="p-3 flex gap-2">
                      {f.status !== 'reviewed' && (
                        <button onClick={() => markReviewed(f.id)} className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition">
                          <CheckCircle className="h-4 w-4" /> Review
                        </button>
                      )}
                      <button onClick={() => deleteFeedback(f.id)} className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={goPrev} disabled={currentPage === 1} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">Prev</button>
              <span className="px-3 py-1">{currentPage} / {totalPages}</span>
              <button onClick={goNext} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">Next</button>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {showToast && <Toast message={toastMessage} type="success" onClose={() => setShowToast(false)} />}
    </div>
  );
}