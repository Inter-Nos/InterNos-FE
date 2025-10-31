'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import KpiCard from '@/components/KpiCard';
import RoomCard from '@/components/RoomCard';
import ShareModal from '@/components/ShareModal';
import Toast from '@/components/Toast';
import { apiA, apiB } from '@/lib/api';
import { fetchSession, isAuthenticated, getCurrentUser } from '@/lib/session';
import { trackEvent, trackUserVisit } from '@/lib/tracking';
import type { DashboardResp, RoomMeta, ErrorResp } from '@/types/api';

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardResp | null>(null);
  const [rooms, setRooms] = useState<RoomMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'24h' | '7d' | 'all'>('24h');
  const [shareModal, setShareModal] = useState<{ url: string; title: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Check authentication
      await fetchSession();
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        const [dashboardData] = await Promise.all([
          apiA.getDashboard(range),
          // Note: API for fetching user's own rooms list is not available in the current API spec.
          // This would require a new endpoint like GET /me/rooms or GET /rooms?ownerId=...
          // For now, rooms list is empty. Backend API should be extended to support this.
        ]);
        setDashboard(dashboardData);
      } catch (error) {
        const errorResp = error as ErrorResp;
        if (errorResp.error.code === 'UNAUTHORIZED') {
          router.push('/login');
        } else {
          setToast({ message: '데이터를 불러오는데 실패했습니다.', type: 'error' });
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Track user visit for dashboard
    const user = getCurrentUser();
    if (user) {
      trackUserVisit();
    }
    
    trackEvent('view_dashboard');
  }, [router, range]);

  const handleShare = (room: RoomMeta) => {
    const shareUrl = `/s/${room.id}`;
    setShareModal({ url: shareUrl, title: room.title });
  };

  const handleEdit = (room: RoomMeta) => {
    // Navigate to edit page (to be implemented)
    // For now, redirect to create page with room data
    router.push(`/create?edit=${room.id}`);
  };

  const handleDelete = async (roomId: number) => {
    if (!confirm('정말 이 방을 삭제하시겠습니까?')) return;

    try {
      await apiB.deleteRoom(roomId);
      setRooms(rooms.filter((r) => r.id !== roomId));
      setToast({ message: '방이 삭제되었습니다.', type: 'success' });
      trackEvent('delete_room', { roomId });
    } catch (error) {
      setToast({ message: '삭제에 실패했습니다.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <Layout headerTitle="대시보드">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </Layout>
    );
  }

  if (!dashboard) {
    return (
      <Layout headerTitle="대시보드">
        <div className="text-center py-8">
          <p className="text-gray-400">데이터를 불러올 수 없습니다.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerTitle="대시보드">
      <div className="space-y-6">
        {/* Range Selector */}
        <div className="flex gap-2">
          {(['24h', '7d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium min-h-[44px] ${
                range === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              {r === '24h' ? '24시간' : r === '7d' ? '7일' : '전체'}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            title="페이지 방문"
            value={dashboard.profileVisits.count}
            range={dashboard.profileVisits.range}
            sparkline={dashboard.profileVisits.sparkline}
          />
          <KpiCard title="총 방 수" value={dashboard.roomsSummary.total} />
          <KpiCard title="공개 방" value={dashboard.roomsSummary.public} />
          <KpiCard title="비공개 방" value={dashboard.roomsSummary.private} />
          <KpiCard title="총 방문" value={dashboard.roomsSummary.visits} />
          <KpiCard title="총 시도" value={dashboard.roomsSummary.attempts} />
          <KpiCard title="해결 수" value={dashboard.roomsSummary.solved} />
          <KpiCard
            title="해결률"
            value={`${(dashboard.roomsSummary.solveRate * 100).toFixed(1)}%`}
          />
        </div>

        {/* My Rooms */}
        <div>
          <h2 className="text-lg font-semibold mb-4">내 방</h2>
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>아직 생성한 방이 없습니다.</p>
              <button
                onClick={() => router.push('/create')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg min-h-[44px]"
              >
                방 만들기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  showActions
                  onEdit={() => handleEdit(room)}
                  onShare={() => handleShare(room)}
                  onDelete={() => handleDelete(room.id)}
                  onClick={() => router.push(`/s/${room.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {shareModal && (
        <ShareModal
          shareUrl={shareModal.url}
          roomTitle={shareModal.title}
          isOpen={!!shareModal}
          onClose={() => setShareModal(null)}
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

