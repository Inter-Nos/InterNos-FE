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
import type { DashboardResp, RoomMeta, ErrorResp, Visibility, Policy, ContentType } from '@/types/api';

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
        const user = getCurrentUser();
        const dashboardData = await apiA.getDashboard(range);
        setDashboard(dashboardData);
        
        // Load user's rooms (try to fetch from available APIs)
        if (user) {
          const roomsData = await loadMyRooms(user.id);
          setRooms(roomsData);
        }
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

  const loadMyRooms = async (ownerId: number): Promise<RoomMeta[]> => {
    if (!ownerId) return [];
    
    try {
      // Strategy: Try to get my rooms from public rooms list
      // Since PublicRoomCard doesn't have ownerId, we use ownerName from session
      // This is not perfect but works for public rooms
      // For private rooms and complete solution, we need GET /me/rooms endpoint
      
      const user = getCurrentUser();
      if (!user?.username) return [];
      
      // Fetch public rooms and filter by ownerName
      // Note: This only works if username matches ownerName in public rooms
      const publicRooms = await apiB.getPublicRooms({ limit: 100 });
      const myPublicRooms = publicRooms.items.filter(
        (room) => room.ownerName === user.username
      );
      
      // For each public room, fetch full RoomMeta using /rooms/{id}
      // This gives us complete information including private room metadata
      const roomPromises = myPublicRooms.map(async (room) => {
        try {
          const roomMeta = await apiB.getRoom(room.id);
          // Verify it's actually owned by current user
          if (roomMeta.ownerId === ownerId) {
            return roomMeta;
          }
          return null;
        } catch (error) {
          // Room might be private or deleted, skip it
          return null;
        }
      });
      
      const rooms = await Promise.all(roomPromises);
      return rooms.filter((room): room is RoomMeta => room !== null);
    } catch (error) {
      // If API call fails, return empty array
      console.error('Failed to load my rooms:', error);
      return [];
    }
  };

  const handleEdit = (room: RoomMeta) => {
    // Navigate to edit page
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

