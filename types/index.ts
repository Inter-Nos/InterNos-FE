export * from './api';

// Component Props Types
export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export interface KpiCardProps {
  title: string;
  value: number | string;
  range?: string;
  sparkline?: number[];
}

export interface RoomCardProps {
  room: import('./api').PublicRoomCard | import('./api').RoomMeta;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onExpire?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

export interface ImageUploaderProps {
  onUploadComplete: (fileRef: string) => void;
  onError: (error: string) => void;
  maxSize?: number; // bytes
  acceptedTypes?: string[];
}

export interface SolveFormProps {
  roomId: number;
  onSuccess: (result: import('./api').SolveResp) => void;
  onError: (error: ErrorResp) => void;
}

export interface ShareModalProps {
  shareUrl: string;
  roomTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

import type { ErrorResp } from './api';

