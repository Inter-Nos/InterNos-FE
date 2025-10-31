import type {
  ErrorResp,
  RegisterReq,
  LoginReq,
  UserResp,
  SessionResp,
  DashboardResp,
  TrackUserVisitReq,
  QueuedResp,
  CreateRoomReq,
  CreateRoomResp,
  RoomMeta,
  UpdateRoomReq,
  UpdatedResp,
  PublicRoomsResp,
  TrendList,
  SolveMeta,
  NonceResp,
  SolveReq,
  SolveResp,
  PresignReq,
  PresignResp,
  TrackRoomVisitReq,
} from '@/types/api';
import { useAuthStore } from '@/store/auth';

const API_A = process.env.NEXT_PUBLIC_API_A || 'https://api.internos.app/a/v1';
const API_B = process.env.NEXT_PUBLIC_API_B || 'https://api.internos.app/b/v1';

// State-changing methods that require CSRF token
const STATE_CHANGING_METHODS = ['POST', 'PATCH', 'DELETE', 'PUT'];

interface FetchOptions extends RequestInit {
  skipCsrf?: boolean;
}

async function fetchWithAuth(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipCsrf, ...fetchOptions } = options;
  const method = fetchOptions.method || 'GET';
  const needsCsrf = STATE_CHANGING_METHODS.includes(method) && !skipCsrf;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add CSRF token for state-changing requests
  if (needsCsrf) {
    const csrfToken = useAuthStore.getState().csrfToken;
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let error: ErrorResp;
    if (isJson) {
      error = await response.json();
    } else {
      error = {
        error: {
          code: `HTTP_${response.status}`,
          message: response.statusText || 'An error occurred',
        },
      };
    }

    // Extract Retry-After header if present
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter && error.error.details) {
      error.error.details.retryAfterSec = parseInt(retryAfter, 10);
    } else if (retryAfter) {
      error.error.details = { retryAfterSec: parseInt(retryAfter, 10) };
    }

    throw error;
  }

  if (isJson) {
    return response.json();
  }

  return {} as T;
}

// Service A - Identity & Portal APIs
export const apiA = {
  // Auth
  async getSession(): Promise<SessionResp> {
    const response = await fetchWithAuth(`${API_A}/auth/session`, {
      skipCsrf: true,
    });
    return handleResponse<SessionResp>(response);
  },

  async register(data: RegisterReq): Promise<UserResp> {
    const response = await fetchWithAuth(`${API_A}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<UserResp>(response);
  },

  async login(data: LoginReq): Promise<UserResp> {
    const response = await fetchWithAuth(`${API_A}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<UserResp>(response);
  },

  async logout(): Promise<void> {
    const response = await fetchWithAuth(`${API_A}/auth/logout`, {
      method: 'POST',
    });
    if (!response.ok) {
      await handleResponse(response);
    }
  },

  // Dashboard
  async getDashboard(range: '24h' | '7d' | 'all' = '24h'): Promise<DashboardResp> {
    const response = await fetchWithAuth(
      `${API_A}/me/dashboard?range=${range}`
    );
    return handleResponse<DashboardResp>(response);
  },

  // Track
  async trackUserVisit(data: TrackUserVisitReq): Promise<QueuedResp> {
    const response = await fetchWithAuth(`${API_A}/track/visit/user`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<QueuedResp>(response);
  },
};

// Service B - Secret Room APIs
export const apiB = {
  // Rooms
  async createRoom(data: CreateRoomReq): Promise<CreateRoomResp> {
    const response = await fetchWithAuth(`${API_B}/rooms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<CreateRoomResp>(response);
  },

  async getRoom(id: number): Promise<RoomMeta> {
    const response = await fetchWithAuth(`${API_B}/rooms/${id}`);
    return handleResponse<RoomMeta>(response);
  },

  async updateRoom(id: number, data: UpdateRoomReq): Promise<UpdatedResp> {
    const response = await fetchWithAuth(`${API_B}/rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse<UpdatedResp>(response);
  },

  async deleteRoom(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_B}/rooms/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      await handleResponse(response);
    }
  },

  // Public Rooms & Rank
  async getPublicRooms(params: {
    sort?: 'trending' | 'new' | 'hard';
    limit?: number;
    cursor?: string;
  }): Promise<PublicRoomsResp> {
    const searchParams = new URLSearchParams();
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.cursor) searchParams.set('cursor', params.cursor);

    const response = await fetchWithAuth(
      `${API_B}/rooms/public?${searchParams.toString()}`
    );
    return handleResponse<PublicRoomsResp>(response);
  },

  async getTrendingRank(limit: number = 50): Promise<TrendList> {
    const response = await fetchWithAuth(
      `${API_B}/rank/trending?limit=${limit}`
    );
    return handleResponse<TrendList>(response);
  },

  // Solve
  async getSolveMeta(id: number): Promise<SolveMeta> {
    const response = await fetchWithAuth(`${API_B}/s/${id}/meta`);
    return handleResponse<SolveMeta>(response);
  },

  async getNonce(roomId: number): Promise<NonceResp> {
    const response = await fetchWithAuth(
      `${API_B}/solve/nonce?roomId=${roomId}`,
      { skipCsrf: true }
    );
    return handleResponse<NonceResp>(response);
  },

  async solve(data: SolveReq): Promise<SolveResp> {
    const response = await fetchWithAuth(`${API_B}/solve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<SolveResp>(response);
  },

  // Upload
  async getPresignedUrl(data: PresignReq): Promise<PresignResp> {
    const response = await fetchWithAuth(`${API_B}/upload/presign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<PresignResp>(response);
  },

  async uploadToGCS(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  },

  // Track
  async trackRoomVisit(data: TrackRoomVisitReq): Promise<QueuedResp> {
    const response = await fetchWithAuth(`${API_B}/track/visit/room`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<QueuedResp>(response);
  },
};

