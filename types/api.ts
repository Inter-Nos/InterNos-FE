// Service A - Identity & Portal API Types

export interface ErrorResp {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface RegisterReq {
  username: string;
  password: string;
}

export type LoginReq = RegisterReq;

export interface User {
  id: number;
  username: string;
  createdAt: string;
}

export interface UserResp {
  user: User;
}

export interface SessionResp {
  authenticated: boolean;
  user: User | null;
  csrfToken: string;
}

export interface ProfileVisits {
  count: number;
  range: string;
  sparkline: number[];
}

export interface RoomsSummary {
  total: number;
  public: number;
  private: number;
  visits: number;
  attempts: number;
  solved: number;
  solveRate: number;
}

export interface DashboardResp {
  profileVisits: ProfileVisits;
  roomsSummary: RoomsSummary;
}

export interface TrackUserVisitReq {
  ownerId: number;
  visitorAnonId?: string;
  ua?: string;
}

export interface QueuedResp {
  queued: boolean;
}

// Service B - Secret Room API Types

export type ContentType = 'TEXT' | 'IMAGE';
export type Visibility = 'PUBLIC' | 'PRIVATE';
export type Policy = 'ONCE' | 'LIMITED' | 'UNLIMITED';

export interface ContentText {
  type: 'TEXT';
  text: string;
}

export interface ContentImage {
  type: 'IMAGE';
  fileRef: string;
  alt?: string | null;
}

export type Content = ContentText | ContentImage;

export interface CreateRoomReq {
  title: string;
  hint: string;
  answer: string;
  content: Content;
  visibility: Visibility;
  policy: Policy;
  viewLimit?: number | null;
  expiresAt?: string | null;
}

export interface CreateRoomResp {
  id: number;
  shareUrl: string;
}

export interface RoomMeta {
  id: number;
  ownerId: number;
  ownerName: string;
  title: string;
  hint: string;
  visibility: Visibility;
  policy: Policy;
  viewLimit: number | null;
  viewsUsed: number;
  expiresAt: string | null;
  isActive: boolean;
  contentType: ContentType;
  thumbnailUrl: string | null;
}

export interface UpdateRoomReq {
  title?: string;
  hint?: string;
  visibility?: Visibility;
  policy?: Policy;
  viewLimit?: number | null;
  expiresAt?: string | null;
}

export interface UpdatedResp {
  updated: boolean;
}

export interface PublicRoomCard {
  id: number;
  title: string;
  hint: string;
  ownerName: string;
  attempts1h: number;
  solveRate1h: number;
  badge: string;
  contentType: ContentType;
}

export interface PublicRoomsResp {
  items: PublicRoomCard[];
  nextCursor: string | null;
}

export interface TrendItem {
  roomId: number;
  trendScore: number;
  attempts1h: number;
  solveRate1h: number;
}

export type TrendList = TrendItem[];

export interface SolveMeta {
  id: number;
  title: string;
  hint: string;
  policy: Policy;
  remaining: number | null;
  limit: number | null;
  expiresAt: string | null;
  locked: boolean;
  retryAfterSec: number | null;
}

export interface NonceResp {
  nonce: string;
  expiresIn: number;
}

export interface SolveReq {
  roomId: number;
  answer: string;
  nonce: string;
}

export interface SolvedText {
  type: 'TEXT';
  text: string;
}

export interface SolvedImage {
  type: 'IMAGE';
  signedUrl: string;
  alt?: string | null;
}

export type SolvedContent = SolvedText | SolvedImage;

export interface PolicyState {
  policy: Policy;
  remaining: number | null;
  limit: number | null;
  expiresAt: string | null;
}

export interface SolveResp {
  ok: boolean;
  content: SolvedContent;
  policyState: PolicyState;
}

export type MimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface PresignReq {
  fileName: string;
  mimeType: MimeType;
  size: number;
}

export interface PresignResp {
  uploadUrl: string;
  fileRef: string;
  expiresIn: number;
}

export interface TrackRoomVisitReq {
  roomId: number;
  visitorAnonId?: string;
  ua?: string;
}

