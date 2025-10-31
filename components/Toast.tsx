'use client';

import { useEffect } from 'react';
import type { ToastProps } from '@/types';

export default function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor =
    type === 'success'
      ? 'bg-green-600'
      : type === 'error'
      ? 'bg-red-600'
      : 'bg-blue-600';

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg max-w-mobile w-[calc(100%-2rem)] animate-slide-down`}
      role="alert"
    >
      <p className="text-sm">{message}</p>
    </div>
  );
}

