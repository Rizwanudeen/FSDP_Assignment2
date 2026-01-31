import { useState, useEffect, ChangeEvent } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Globe,
  Sun,
  Moon,
  Hash,
  Briefcase,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

export type UserFeedbackType = {
  id: string;
  title: string;
  content: string;
  date: string;
  status: 'new' | 'reviewed';
};

export default function Profile() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    phone: '',
    language: 'English',
    role: 'Agent',
    agentId: '',
    notifications: true
  });

  const [avatar, setAvatar] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activityFeed, setActivityFeed] = useState<string[]>([]);

  // --- Feedback state ---
  const [feedbacks, setFeedbacks] = useState<UserFeedbackType[]>([]);

  // Load user data & feedbacks
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user) {
      setUserData(prev => ({ ...prev, ...user, notifications: user.notifications ?? true }));
      if (user.avatar) setAvatar(user.avatar);

      const feed = JSON.parse(localStorage.getItem('activityFeed') || '[]');
      setActivityFeed(feed);
    }

    const storedFeedbackRaw = JSON.parse(localStorage.getItem('userFeedbacks') || '[]');
    if (storedFeedbackRaw.length === 0) {
      const sample: UserFeedbackType[] = [
        { id: '1', title: 'Login Issue', content: 'Had trouble logging in yesterday.', date: '2026-01-27', status: 'new' },
        { id: '2', title: 'UI Suggestion', content: 'Can we add dark mode toggle?', date: '2026-01-26', status: 'reviewed' },
        { id: '3', title: 'Performance', content: 'App is slightly slow when opening dashboard.', date: '2026-01-25', status: 'new' }
      ];
      setFeedbacks(sample);
      localStorage.setItem('userFeedbacks', JSON.stringify(sample));
    } else {
      // Normalize status to 'new' | 'reviewed'
      const normalized = storedFeedbackRaw.map((fb: any) => ({
        ...fb,
        status: fb.status === 'reviewed' ? 'reviewed' : 'new'
      })) as UserFeedbackType[];
      setFeedbacks(normalized);
    }
  }, []);

  // Theme effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Log activity
  const addActivity = (msg: string) => {
    const newFeed = [msg, ...activityFeed].slice(0, 10);
    setActivityFeed(newFeed);
    localStorage.setItem('activityFeed', JSON.stringify(newFeed));
  };

  const handleChange = (field: string, value: string | boolean, log = true) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    if (log) addActivity(`Updated ${field}`);
  };

  // Avatar
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
        addActivity('Changed avatar');
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveAvatar = () => {
    setAvatar(null);
    addActivity('Removed avatar');
  };

  // Save profile
  const handleSave = () => {
    localStorage.setItem('user', JSON.stringify({ ...userData, avatar }));
    setToastMessage('✅ Profile updated successfully!');
    setShowToast(true);
    addActivity('Saved profile');
  };

  // Linear profile completeness
  const completeness =
    ((userData.fullName ? 1 : 0) +
      (userData.email ? 1 : 0) +
      (userData.phone ? 1 : 0) +
      (avatar ? 1 : 0)) / 4;

  const initials = userData.fullName
    ? userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'AG';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Profile & Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-full border-4 border-blue-500 overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-3xl font-bold text-gray-600 dark:text-gray-300 shadow">
            {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="Avatar" /> : initials}
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Change Avatar
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
            {avatar && (
              <button onClick={handleRemoveAvatar} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Linear Profile Completeness */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <span className="font-medium">Profile Completeness</span>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full mt-2">
            <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${Math.round(completeness * 100)}%` }}></div>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 block">{Math.round(completeness * 100)}% complete</span>
        </div>

        {/* Personal Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputWithIcon icon={<User />} placeholder="Full Name" value={userData.fullName} onChange={(val) => handleChange('fullName', val, false)} onBlur={() => addActivity('Updated full name')} />
            <InputWithIcon icon={<Mail />} placeholder="Email" value={userData.email} onChange={(val) => handleChange('email', val, false)} onBlur={() => addActivity('Updated email')} />
            <InputWithIcon icon={<Phone />} placeholder="Phone Number" value={userData.phone} onChange={(val) => handleChange('phone', val, false)} onBlur={() => addActivity('Updated phone number')} />
            <SelectWithIcon icon={<Globe />} value={userData.language} options={['English', 'Chinese', 'Malay', 'Tamil', 'French', 'Spanish', 'German']} onChange={(val) => handleChange('language', val)} />
            <InputWithIcon icon={<Briefcase />} value={userData.role} readOnly />
            <InputWithIcon icon={<Hash />} value={userData.agentId} readOnly />
            <div className="flex items-center gap-3">
              <Bell />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={userData.notifications} onChange={(e) => handleChange('notifications', e.target.checked)} className="h-4 w-4 accent-blue-600" />
                Enable Notifications
              </label>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-2 overflow-x-auto">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          {activityFeed.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
          ) : (
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {activityFeed.map((act, i) => <li key={i}>• {act}</li>)}
            </ul>
          )}
        </div>

        {/* Feedback Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Your Feedback</h2>
          {feedbacks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No feedback submitted</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  onClick={() => navigate(`/feedback-detail/${fb.id}`)}
                  className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer"
                >
                  <h3 className="font-medium">{fb.title}</h3>
                  <p className="text-sm mt-1">{fb.content}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-300 mt-2 block">{fb.date}</span>
                  <span className={`text-xs mt-1 inline-block px-2 py-1 rounded-full ${fb.status === 'new' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' : 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100'}`}>
                    {fb.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme + Save */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
            <span className="font-medium">Theme</span>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Toggle Theme">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>
          <button onClick={handleSave} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg">
            Save Changes
          </button>
        </div>
      </div>

      {showToast && <Toast message={toastMessage} type="success" onClose={() => setShowToast(false)} />}
    </div>
  );
}

// --- Helper Components ---
type InputProps = {
  icon: JSX.Element;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  onBlur?: () => void;
  readOnly?: boolean;
};
function InputWithIcon({ icon, placeholder, value, onChange, onBlur, readOnly }: InputProps) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        className={`flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}

type SelectProps = {
  icon: JSX.Element;
  value: string;
  options: string[];
  onChange: (val: string) => void;
};
function SelectWithIcon({ icon, value, options, onChange }: SelectProps) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}