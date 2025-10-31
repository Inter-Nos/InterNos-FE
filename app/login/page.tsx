'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiA } from '@/lib/api';
import { fetchSession } from '@/lib/session';
import { useAuthStore } from '@/store/auth';
import { trackEvent } from '@/lib/tracking';
import type { ErrorResp } from '@/types/api';
import Toast from '@/components/Toast';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize CSRF token on page load
    fetchSession().catch(() => {
      // Ignore errors on initial load
    });
    
    trackEvent('view_login');
  }, []);

  const validateForm = (): boolean => {
    // Username: 2-20 characters, alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]{2,20}$/.test(username)) {
      setError('사용자명은 2-20자의 영문, 숫자, 언더스코어만 사용할 수 있습니다.');
      return false;
    }

    // Password: at least 8 characters
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        await apiA.register({ username, password });
        trackEvent('submit_register', { username });
        setToast({ message: '가입 완료! 로그인 중...', type: 'success' });
      } else {
        await apiA.login({ username, password });
        trackEvent('submit_login', { username });
      }

      // Refresh session to get CSRF token
      await fetchSession();
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorResp = err as ErrorResp;
      const errorCode = errorResp?.error?.code || 'UNKNOWN';
      const errorMessage = errorResp?.error?.message || '오류가 발생했습니다.';

      switch (errorCode) {
        case 'CONFLICT':
          setError('이미 사용 중인 사용자명입니다.');
          break;
        case 'UNAUTHORIZED':
          setError('사용자명 또는 비밀번호가 올바르지 않습니다.');
          break;
        case 'RATE_LIMITED':
          const retryAfter = errorResp.error.details?.retryAfterSec as number | undefined;
          setError(
            retryAfter
              ? `너무 많은 시도입니다. ${retryAfter}초 후에 다시 시도해주세요.`
              : '너무 많은 시도입니다. 잠시 후에 다시 시도해주세요.'
          );
          break;
        default:
          setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-mobile mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-center">Inter Nos</h1>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium min-h-[44px] ${
                mode === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium min-h-[44px] ${
                mode === 'register'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              가입
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                사용자명
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="2-20자 (영문, 숫자, _)"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                required
                disabled={loading}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium min-h-[44px]"
            >
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입'}
            </button>
          </form>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

