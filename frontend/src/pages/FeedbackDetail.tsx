import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

export default function FeedbackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{ title: string; content: string; date: string } | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const allFeedback = JSON.parse(localStorage.getItem('userFeedbacks') || '[]');
    const fb = allFeedback.find((f: any) => f.id === id);
    if (fb) setFeedback(fb);
  }, [id]);

  const handleSave = () => {
    if (!feedback) return;
    const allFeedback = JSON.parse(localStorage.getItem('userFeedbacks') || '[]');
    const updated = allFeedback.map((f: any) => (f.id === id ? feedback : f));
    localStorage.setItem('userFeedbacks', JSON.stringify(updated));
    setToastMessage('✅ Feedback updated!');
    setShowToast(true);
  };

  const handleDelete = () => {
    const allFeedback = JSON.parse(localStorage.getItem('userFeedbacks') || '[]');
    const updated = allFeedback.filter((f: any) => f.id !== id);
    localStorage.setItem('userFeedbacks', JSON.stringify(updated));
    navigate('/profile');
  };

  if (!feedback) return <p className="text-center mt-10">Feedback not found</p>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/profile')} className="mb-4 text-blue-600 hover:underline">← Back to Profile</button>
      <h1 className="text-2xl font-bold mb-4">Edit Feedback</h1>
      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={feedback.title}
          onChange={(e) => setFeedback({ ...feedback, title: e.target.value })}
          className="border rounded p-2 bg-white dark:bg-gray-700"
        />
        <textarea
          value={feedback.content}
          onChange={(e) => setFeedback({ ...feedback, content: e.target.value })}
          className="border rounded p-2 bg-white dark:bg-gray-700 h-40"
        />
        <span className="text-sm text-gray-500 dark:text-gray-300">Date: {feedback.date}</span>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
        </div>
      </div>

      {showToast && <Toast message={toastMessage} type="success" onClose={() => setShowToast(false)} />}
    </div>
  );
}