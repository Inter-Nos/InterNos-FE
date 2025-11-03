'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import ImageUploader from '@/components/ImageUploader';
import ShareModal from '@/components/ShareModal';
import Toast from '@/components/Toast';
import { apiB } from '@/lib/api';
import { fetchSession, isAuthenticated } from '@/lib/session';
import { trackEvent } from '@/lib/tracking';
import type { CreateRoomReq, ContentType, Visibility, Policy, ErrorResp, RoomMeta } from '@/types/api';

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editRoomId = searchParams.get('edit') ? parseInt(searchParams.get('edit')!, 10) : null;
  const isEditMode = !!editRoomId;
  const [title, setTitle] = useState('');
  const [hint, setHint] = useState('');
  const [answer, setAnswer] = useState('');
  const [contentType, setContentType] = useState<ContentType>('TEXT');
  const [contentText, setContentText] = useState('');
  const [imageFileRef, setImageFileRef] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [policy, setPolicy] = useState<Policy>('ONCE');
  const [viewLimit, setViewLimit] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shareModal, setShareModal] = useState<{ url: string; title: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      await fetchSession();
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Load room data if in edit mode
      if (isEditMode && editRoomId) {
        loadRoomForEdit(editRoomId);
      }
    };
    checkAuth();
    
    trackEvent(isEditMode ? 'view_edit_room' : 'view_create');
  }, [router, isEditMode, editRoomId]);

  const handleImageUploadComplete = (fileRef: string) => {
    setImageFileRef(fileRef);
    setUploadError(null);
  };

  const handleImageUploadError = (error: string) => {
    setUploadError(error);
    setImageFileRef(null);
  };

  const loadRoomForEdit = async (roomId: number) => {
    try {
      const room = await apiB.getRoom(roomId);
      setTitle(room.title);
      setHint(room.hint);
      setContentType(room.contentType);
      setVisibility(room.visibility);
      setPolicy(room.policy);
      setViewLimit(room.viewLimit?.toString() || '');
      setExpiresAt(room.expiresAt ? new Date(room.expiresAt).toISOString().slice(0, 16) : '');
      
      if (room.contentType === 'TEXT') {
        // Note: RoomMeta doesn't include content_text, so we can't pre-fill it
        // This would require an additional API call or extending RoomMeta schema
      } else if (room.contentType === 'IMAGE') {
        // Note: RoomMeta doesn't include image info for editing
        // User needs to re-upload if editing image
      }
    } catch (error) {
      const errorResp = error as ErrorResp;
      setToast({
        message: errorResp?.error?.message || '방 정보를 불러오는데 실패했습니다.',
        type: 'error',
      });
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    // Validation
    if (title.length < 2 || title.length > 80) {
      setToast({ message: '제목은 2-80자여야 합니다.', type: 'error' });
      return;
    }

    if (hint.length < 2 || hint.length > 120) {
      setToast({ message: '힌트는 2-120자여야 합니다.', type: 'error' });
      return;
    }

    if (!answer.trim()) {
      setToast({ message: '정답을 입력해주세요.', type: 'error' });
      return;
    }

    if (contentType === 'TEXT' && !contentText.trim()) {
      setToast({ message: '콘텐츠 텍스트를 입력해주세요.', type: 'error' });
      return;
    }

    if (contentType === 'IMAGE' && !imageFileRef) {
      setToast({ message: '이미지를 업로드해주세요.', type: 'error' });
      return;
    }

    if (policy === 'LIMITED') {
      const limit = parseInt(viewLimit, 10);
      if (!limit || limit < 1) {
        setToast({ message: 'LIMITED 정책은 viewLimit가 1 이상이어야 합니다.', type: 'error' });
        return;
      }
    }

    setSubmitting(true);

    try {
      const content =
        contentType === 'TEXT'
          ? { type: 'TEXT' as const, text: contentText }
          : { type: 'IMAGE' as const, fileRef: imageFileRef!, alt: null };

      const req: CreateRoomReq = {
        title: title.trim(),
        hint: hint.trim(),
        answer: answer.trim(),
        content,
        visibility,
        policy,
        viewLimit: policy === 'LIMITED' ? parseInt(viewLimit, 10) : null,
        expiresAt: expiresAt || null,
      };

      if (isEditMode && editRoomId) {
        // Update existing room
        await apiB.updateRoom(editRoomId, {
          title: req.title,
          hint: req.hint,
          visibility: req.visibility,
          policy: req.policy,
          viewLimit: req.viewLimit,
          expiresAt: req.expiresAt,
        });

        trackEvent('update_room', {
          roomId: editRoomId,
          visibility,
          policy,
        });

        setToast({ message: '방이 수정되었습니다.', type: 'success' });
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        // Create new room
        const result = await apiB.createRoom(req);

        trackEvent('submit_create_room', {
          roomId: result.id,
          visibility,
          contentType,
          policy,
        });

        setShareModal({
          url: result.shareUrl,
          title: title,
        });
      }
    } catch (error) {
      const errorResp = error as ErrorResp;
      setToast({
        message: errorResp?.error?.message || '방 생성에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout headerTitle={isEditMode ? "방 수정" : "방 만들기"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            제목 *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="2-80자"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            required
            minLength={2}
            maxLength={80}
            disabled={submitting}
          />
        </div>

        {/* Hint */}
        <div>
          <label htmlFor="hint" className="block text-sm font-medium mb-2">
            힌트 *
          </label>
          <textarea
            id="hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="2-120자"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
            required
            minLength={2}
            maxLength={120}
            disabled={submitting}
          />
        </div>

        {/* Answer */}
        <div>
          <label htmlFor="answer" className="block text-sm font-medium mb-2">
            정답 *
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

        {/* Content Type */}
        <div>
          <label className="block text-sm font-medium mb-2">콘텐츠 타입 *</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setContentType('TEXT');
                setImageFileRef(null);
              }}
              className={`flex-1 px-4 py-3 rounded-lg font-medium min-h-[44px] ${
                contentType === 'TEXT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
              disabled={submitting}
            >
              텍스트
            </button>
            <button
              type="button"
              onClick={() => {
                setContentType('IMAGE');
                setContentText('');
              }}
              className={`flex-1 px-4 py-3 rounded-lg font-medium min-h-[44px] ${
                contentType === 'IMAGE'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
              disabled={submitting}
            >
              이미지
            </button>
          </div>
        </div>

        {/* Content */}
        {contentType === 'TEXT' ? (
          <div>
            <label htmlFor="content-text" className="block text-sm font-medium mb-2">
              콘텐츠 텍스트 *
            </label>
            <textarea
              id="content-text"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="최대 10,000자"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-none"
              required
              maxLength={10000}
              disabled={submitting}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">이미지 *</label>
            <ImageUploader
              onUploadComplete={handleImageUploadComplete}
              onError={handleImageUploadError}
            />
            {uploadError && (
              <p className="mt-2 text-sm text-red-400">{uploadError}</p>
            )}
          </div>
        )}

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium mb-2">공개 설정 *</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisibility('PUBLIC')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium min-h-[44px] ${
                visibility === 'PUBLIC'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
              disabled={submitting}
            >
              공개
            </button>
            <button
              type="button"
              onClick={() => setVisibility('PRIVATE')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium min-h-[44px] ${
                visibility === 'PRIVATE'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
              disabled={submitting}
            >
              비공개
            </button>
          </div>
        </div>

        {/* Policy */}
        <div>
          <label htmlFor="policy" className="block text-sm font-medium mb-2">
            정책 *
          </label>
          <select
            id="policy"
            value={policy}
            onChange={(e) => {
              setPolicy(e.target.value as Policy);
              if (e.target.value !== 'LIMITED') {
                setViewLimit('');
              }
            }}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            required
            disabled={submitting}
          >
            <option value="ONCE">1회</option>
            <option value="LIMITED">횟수 제한</option>
            <option value="UNLIMITED">무제한</option>
          </select>
        </div>

        {/* View Limit */}
        {policy === 'LIMITED' && (
          <div>
            <label htmlFor="view-limit" className="block text-sm font-medium mb-2">
              최대 열람 횟수 *
            </label>
            <input
              id="view-limit"
              type="number"
              value={viewLimit}
              onChange={(e) => setViewLimit(e.target.value)}
              placeholder="1 이상"
              min={1}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              required
              disabled={submitting}
            />
          </div>
        )}

        {/* Expires At */}
        <div>
          <label htmlFor="expires-at" className="block text-sm font-medium mb-2">
            만료일 (선택)
          </label>
          <input
            id="expires-at"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            disabled={submitting}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium min-h-[44px]"
        >
          {submitting
            ? isEditMode
              ? '수정 중...'
              : '생성 중...'
            : isEditMode
            ? '방 수정'
            : '방 만들기'}
        </button>
      </form>

      {shareModal && (
        <ShareModal
          shareUrl={shareModal.url}
          roomTitle={shareModal.title}
          isOpen={!!shareModal}
          onClose={() => {
            setShareModal(null);
            router.push('/dashboard');
          }}
        />
      )}

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

export default function CreatePage() {
  return (
    <Suspense fallback={
      <Layout headerTitle="방 만들기">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </Layout>
    }>
      <CreatePageContent />
    </Suspense>
  );
}

