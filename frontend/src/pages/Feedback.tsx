import { useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

export default function Feedback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('bug');
  const [submitted, setSubmitted] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const MAX_CHARS = 300;

  // --- MOCK USER ROLE ---
  const userData = {
    role: 'admin', // change to 'user' to hide admin button
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const existingFeedback = JSON.parse(
      localStorage.getItem('feedbacks') || '[]'
    );

    const newFeedback = {
      id: Date.now(),
      category,
      message,
      status: 'new',
      date: new Date().toLocaleString(),
    };

    localStorage.setItem(
      'feedbacks',
      JSON.stringify([...existingFeedback, newFeedback])
    );

    // Show toast notification
    setToastMessage('✅ Feedback submitted!');
    setShowToast(true);

    setSubmitted(true);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">Give Feedback</h1>
            {/* Admin button mock */}
            {userData.role === 'admin' && (
              <button
                onClick={() => navigate('/admin-feedback')}
                className="mt-1 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition w-fit"
              >
                Admin: View All Feedback
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-600 rounded-lg text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-medium">We’d love your feedback</h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Tell us what’s working, what’s confusing, or what you’d like improved.
            </p>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Feedback category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="bug">Bug / Issue</option>
                <option value="feature">Feature Request</option>
                <option value="ui">UI / UX</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Message */}
            <div className="mb-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                rows={5}
                placeholder="Type your feedback here..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                {message.length} / {MAX_CHARS}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={!message.trim()}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <MessageCircle className="h-10 w-10 text-green-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Thank you!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your feedback has been received.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}