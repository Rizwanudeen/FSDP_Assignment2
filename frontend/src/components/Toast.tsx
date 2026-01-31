import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number; // in ms
  onClose: () => void;
};

export default function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);

    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300); // wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === 'success'
      ? 'bg-green-600 text-white'
      : type === 'error'
      ? 'bg-red-600 text-white'
      : 'bg-blue-600 text-white';

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 transform transition-all duration-300
        ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${bgColor}`}
      >
        <span className="flex-1">{message}</span>
        <button
          onClick={() => setShow(false)}
          className="hover:text-gray-200 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}