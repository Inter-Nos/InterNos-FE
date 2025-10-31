import { apiA, apiB } from './api';
import { getCurrentUser } from './session';

/**
 * Track user visit (profile page)
 */
export async function trackUserVisit() {
  try {
    const user = getCurrentUser();
    if (!user) return;

    await apiA.trackUserVisit({
      ownerId: user.id,
      visitorAnonId: getOrCreateAnonId(),
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    });
  } catch (error) {
    // Silently fail - tracking should not break user experience
    console.error('Failed to track user visit:', error);
  }
}

/**
 * Track room visit
 */
export async function trackRoomVisit(roomId: number) {
  try {
    await apiB.trackRoomVisit({
      roomId,
      visitorAnonId: getOrCreateAnonId(),
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    });
  } catch (error) {
    // Silently fail - tracking should not break user experience
    console.error('Failed to track room visit:', error);
  }
}

/**
 * Get or create anonymous visitor ID
 */
function getOrCreateAnonId(): string {
  if (typeof window === 'undefined') return '';

  const key = 'internos_visitor_id';
  let anonId = localStorage.getItem(key);

  if (!anonId) {
    // Generate a simple anonymous ID
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(key, anonId);
  }

  return anonId;
}

/**
 * Track frontend events (for analytics, not sent to backend directly)
 * This is a placeholder for frontend analytics integration
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  // Do not log sensitive information (password, answer, tokens)
  const sensitiveKeys = ['password', 'answer', 'token', 'csrfToken'];
  
  if (properties) {
    const sanitized = { ...properties };
    sensitiveKeys.forEach((key) => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Event] ${eventName}`, sanitized);
    }
  }

  // Here you would integrate with analytics service (e.g., Google Analytics, Mixpanel, etc.)
  // Example:
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', eventName, properties);
  // }
}

