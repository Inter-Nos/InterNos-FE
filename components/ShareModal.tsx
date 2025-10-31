'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { ShareModalProps } from '@/types';

export default function ShareModal({
  shareUrl,
  roomTitle,
  isOpen,
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) return null;

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${shareUrl}` : shareUrl;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg p-6 max-w-sm w-full border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">방 공유</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {roomTitle && (
          <p className="text-sm text-gray-400 mb-4">{roomTitle}</p>
        )}

        <div className="flex flex-col items-center space-y-4 mb-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={fullUrl} size={200} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={fullUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded font-medium min-h-[44px] ${
                copied
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {copied ? '✓ 복사됨' : '복사'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

