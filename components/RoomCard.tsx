'use client';

import type { RoomCardProps } from '@/types';
import type { PublicRoomCard, RoomMeta } from '@/types/api';

export default function RoomCard({ room, onClick, showActions, onEdit, onDelete, onShare }: RoomCardProps) {
  const isPublicCard = 'attempts1h' in room;
  const publicCard = isPublicCard ? (room as PublicRoomCard) : null;
  const roomMeta = !isPublicCard ? (room as RoomMeta) : null;

  const getPolicyLabel = (policy: string) => {
    switch (policy) {
      case 'ONCE':
        return '1회';
      case 'LIMITED':
        return '제한';
      case 'UNLIMITED':
        return '무제한';
      default:
        return policy;
    }
  };

  const getContentTypeBadge = (contentType: string) => {
    return (
      <span className="text-xs px-2 py-1 bg-gray-800 rounded">
        {contentType === 'TEXT' ? '텍스트' : '이미지'}
      </span>
    );
  };

  return (
    <div
      className="bg-gray-900 rounded-lg p-4 border border-gray-800 cursor-pointer hover:border-gray-700 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold flex-1">{room.title}</h3>
        {getContentTypeBadge(room.contentType)}
      </div>

      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{room.hint}</p>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>작성자: {isPublicCard ? publicCard?.ownerName : roomMeta?.ownerName}</span>
        {roomMeta && <span>{getPolicyLabel(roomMeta.policy)}</span>}
      </div>

      {publicCard && (
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>시도: {publicCard.attempts1h}</span>
          <span>성공률: {(publicCard.solveRate1h * 100).toFixed(1)}%</span>
        </div>
      )}

      {roomMeta && (
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
          {roomMeta.viewsUsed !== undefined && roomMeta.viewLimit !== null && (
            <span>남은 횟수: {Math.max(0, roomMeta.viewLimit - roomMeta.viewsUsed)}</span>
          )}
          {roomMeta.expiresAt && (
            <span>만료: {new Date(roomMeta.expiresAt).toLocaleDateString('ko-KR')}</span>
          )}
        </div>
      )}

      {showActions && (onEdit || onDelete || onShare) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              수정
            </button>
          )}
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
            >
              공유
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              삭제
            </button>
          )}
        </div>
      )}
    </div>
  );
}

