'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import RoomCard from '@/components/RoomCard';
import Toast from '@/components/Toast';
import { apiB } from '@/lib/api';
import { trackEvent, trackRoomVisit } from '@/lib/tracking';
import type { PublicRoomCard, ErrorResp } from '@/types/api';

type SortType = 'trending' | 'new' | 'hard';

export default function RoomsPage() {
  const router = useRouter();
  const [sort, setSort] = useState<SortType>('trending');
  const [rooms, setRooms] = useState<PublicRoomCard[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadRooms = useCallback(
    async (append = false) => {
      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const result = await apiB.getPublicRooms({
          sort,
          limit: 20,
          cursor: append ? nextCursor || undefined : undefined,
        });

        if (append) {
          setRooms((prev) => [...prev, ...result.items]);
        } else {
          setRooms(result.items);
        }
        setNextCursor(result.nextCursor);
      } catch (error) {
        const errorResp = error as ErrorResp;
        setToast({
          message: errorResp?.error?.message || '방 목록을 불러오는데 실패했습니다.',
          type: 'error',
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort, nextCursor]
  );

  useEffect(() => {
    loadRooms(false);
    trackEvent('view_rooms', { sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      loadRooms(true);
    }
  };

  const getSortLabel = (s: SortType) => {
    switch (s) {
      case 'trending':
        return '트렌딩';
      case 'new':
        return '최신';
      case 'hard':
        return '어려운';
    }
  };

  return (
    <Layout headerTitle="공개 방">
      <div className="space-y-4">
        {/* Sort Tabs */}
        <div className="flex gap-2">
          {(['trending', 'new', 'hard'] as SortType[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium min-h-[44px] ${
                sort === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              {getSortLabel(s)}
            </button>
          ))}
        </div>

        {/* Rooms List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">로딩 중...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>공개된 방이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onClick={() => {
                    trackRoomVisit(room.id);
                    router.push(`/s/${room.id}`);
                  }}
                />
              ))}
            </div>

            {/* Load More */}
            {nextCursor && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed rounded-lg font-medium min-h-[44px]"
              >
                {loadingMore ? '로딩 중...' : '더 보기'}
              </button>
            )}
          </>
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

