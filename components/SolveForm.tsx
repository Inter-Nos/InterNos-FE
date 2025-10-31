'use client';

import { useState } from 'react';
import { apiB } from '@/lib/api';
import type { SolveFormProps } from '@/types';

export default function SolveForm({ roomId, onSuccess, onError }: SolveFormProps) {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || submitting) return;

    setSubmitting(true);

    try {
      // Step 1: Get nonce
      const nonceResp = await apiB.getNonce(roomId);

      // Step 2: Submit solve request
      const result = await apiB.solve({
        roomId,
        answer: answer.trim(),
        nonce: nonceResp.nonce,
      });

      onSuccess(result);
    } catch (error: unknown) {
      onError(error as any);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="answer" className="block text-sm font-medium mb-2">
          정답 입력
        </label>
        <input
          id="answer"
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="정답을 입력하세요"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          required
          disabled={submitting}
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        disabled={!answer.trim() || submitting}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium min-h-[44px]"
      >
        {submitting ? '제출 중...' : '정답 제출'}
      </button>
    </form>
  );
}

