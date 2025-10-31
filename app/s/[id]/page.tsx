'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import SolveForm from '@/components/SolveForm';
import Toast from '@/components/Toast';
import { apiB } from '@/lib/api';
import type { SolveMeta, SolveResp, ErrorResp } from '@/types/api';

export default function SolvePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = parseInt(params.id as string, 10);

  const [solveMeta, setSolveMeta] = useState<SolveMeta | null>(null);
  const [solveResult, setSolveResult] = useState<SolveResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isNaN(roomId)) {
      setError('잘못된 방 ID입니다.');
      setLoading(false);
      return;
    }

    loadSolveMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Countdown timer for retry
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev === null || prev <= 1) {
            setLocked(false);
            loadSolveMeta(); // Reload meta to check if still locked
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryAfter]);

  const loadSolveMeta = async () => {
    try {
      setLoading(true);
      setError(null);
      const meta = await apiB.getSolveMeta(roomId);
      setSolveMeta(meta);
      setLocked(meta.locked);
      if (meta.retryAfterSec) {
        setRetryAfter(meta.retryAfterSec);
      }
    } catch (err: unknown) {
      const errorResp = err as ErrorResp;
      if (errorResp.error.code === 'NOT_FOUND') {
        setError('존재하지 않거나 접근할 수 없는 방입니다.');
      } else if (errorResp.error.code === 'GONE') {
        setError('이 방은 만료되었거나 더 이상 열람할 수 없습니다.');
      } else {
        setError(errorResp.error.message || '방 정보를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSolveSuccess = (result: SolveResp) => {
    setSolveResult(result);
  };

  const handleSolveError = (errorResp: ErrorResp) => {
    const errorCode = errorResp.error.code;

    switch (errorCode) {
      case 'LOCKED':
        const retrySec = (errorResp.error.details?.retryAfterSec as number) || 0;
        setLocked(true);
        setRetryAfter(retrySec);
        setToast({
          message: `너무 많은 시도입니다. ${retrySec}초 후에 다시 시도해주세요.`,
          type: 'error',
        });
        break;
      case 'RATE_LIMITED':
        const rateRetrySec = (errorResp.error.details?.retryAfterSec as number) || 0;
        setToast({
          message: `요청이 너무 많습니다. ${rateRetrySec}초 후에 다시 시도해주세요.`,
          type: 'error',
        });
        break;
      case 'GONE':
        setError('이 방은 만료되었거나 더 이상 열람할 수 없습니다.');
        break;
      default:
        setToast({
          message: errorResp.error.message || '정답 제출에 실패했습니다.',
          type: 'error',
        });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Layout headerTitle="방 풀이">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </Layout>
    );
  }

  if (error && !solveMeta) {
    return (
      <Layout headerTitle="방 풀이">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/rooms')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg min-h-[44px]"
          >
            공개 방 보러가기
          </button>
        </div>
      </Layout>
    );
  }

  if (!solveMeta) {
    return null;
  }

  return (
    <Layout headerTitle={solveMeta.title}>
      <div className="space-y-6">
        {/* Hint */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">힌트</h3>
          <p className="text-lg">{solveMeta.hint}</p>
        </div>

        {/* Policy Info */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">정책:</span>
            <span>
              {solveMeta.policy === 'ONCE'
                ? '1회'
                : solveMeta.policy === 'LIMITED'
                ? '제한'
                : '무제한'}
            </span>
          </div>
          {solveMeta.remaining !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">남은 횟수:</span>
              <span>{solveMeta.remaining}</span>
            </div>
          )}
          {solveMeta.expiresAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">만료일:</span>
              <span>{new Date(solveMeta.expiresAt).toLocaleString('ko-KR')}</span>
            </div>
          )}
        </div>

        {/* Locked State */}
        {locked && retryAfter !== null && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
            <p className="text-red-400 mb-2">
              너무 많은 시도로 인해 일시적으로 잠겼습니다.
            </p>
            <p className="text-sm text-red-300">다시 시도 가능 시간: {formatTime(retryAfter)}</p>
          </div>
        )}

        {/* Solve Result */}
        {solveResult ? (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
              <p className="text-green-400 font-semibold mb-4">정답입니다! 🎉</p>

              {solveResult.content.type === 'TEXT' ? (
                <div className="bg-black rounded-lg p-4 border border-gray-700">
                  <p className="whitespace-pre-wrap">{solveResult.content.text}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {solveResult.content.alt && (
                    <p className="text-sm text-gray-400">{solveResult.content.alt}</p>
                  )}
                  <img
                    src={solveResult.content.signedUrl}
                    alt={solveResult.content.alt || 'Solved content'}
                    className="w-full rounded-lg"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      setToast({
                        message: '이미지를 불러올 수 없습니다. (만료되었을 수 있습니다)',
                        type: 'error',
                      });
                    }}
                  />
                </div>
              )}
            </div>

            {solveResult.policyState.remaining !== null && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <p className="text-sm text-gray-400">
                  남은 횟수: {solveResult.policyState.remaining}
                </p>
              </div>
            )}

            <button
              onClick={() => router.push('/rooms')}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium min-h-[44px]"
            >
              다른 방 보러가기
            </button>
          </div>
        ) : (
          !locked && (
            <SolveForm
              roomId={roomId}
              onSuccess={handleSolveSuccess}
              onError={handleSolveError}
            />
          )
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
}

