import { apiA } from './api';
import { useAuthStore } from '@/store/auth';

/**
 * Fetch current session and CSRF token
 * Call this on app initialization and after login/logout
 */
export async function fetchSession(): Promise<void> {
  try {
    const session = await apiA.getSession();
    useAuthStore.getState().setSession(session);
  } catch (error) {
    // If session fetch fails, clear auth state
    useAuthStore.getState().clearSession();
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return useAuthStore.getState().authenticated;
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return useAuthStore.getState().user;
}

