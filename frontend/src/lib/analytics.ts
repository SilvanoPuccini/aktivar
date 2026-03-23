/**
 * Lightweight analytics tracker for Aktivar.
 *
 * Events are buffered and sent in batches to reduce network requests.
 * When a real analytics backend is configured (VITE_ANALYTICS_ENDPOINT),
 * events are POSTed there. Otherwise they're logged to console in dev.
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
}

const BUFFER_SIZE = 10;
const FLUSH_INTERVAL_MS = 30_000; // 30 seconds
const ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT || '';

let buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function flush() {
  if (buffer.length === 0) return;
  const events = [...buffer];
  buffer = [];

  if (ENDPOINT) {
    const token = sessionStorage.getItem('aktivar_access_token');
    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ events }),
      keepalive: true,
    }).catch(() => {
      // Re-queue failed events (up to buffer limit)
      buffer.push(...events.slice(0, BUFFER_SIZE));
    });
  } else if (import.meta.env.DEV) {
    console.groupCollapsed(`[Analytics] Flushing ${events.length} events`);
    events.forEach((e) => console.log(e.name, e.properties));
    console.groupEnd();
  }
}

function ensureTimer() {
  if (!flushTimer) {
    flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
  }
}

/**
 * Track an analytics event.
 */
export function track(name: string, properties?: Record<string, string | number | boolean>) {
  buffer.push({ name, properties, timestamp: Date.now() });
  ensureTimer();
  if (buffer.length >= BUFFER_SIZE) flush();
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

// ── Pre-defined event helpers ─────────────────────────────────────

export const analytics = {
  pageView: (page: string) => track('page_view', { page }),
  activityViewed: (id: number) => track('activity_viewed', { activity_id: id }),
  activityJoined: (id: number) => track('activity_joined', { activity_id: id }),
  activityCreated: (id: number) => track('activity_created', { activity_id: id }),
  tripBooked: (id: number) => track('trip_booked', { trip_id: id }),
  paymentStarted: (amount: number) => track('payment_started', { amount }),
  paymentCompleted: (amount: number) => track('payment_completed', { amount }),
  searchPerformed: (query: string) => track('search', { query }),
  loginCompleted: () => track('login_completed'),
  registerCompleted: () => track('register_completed'),
  emergencyTriggered: (tripId: number) => track('emergency_triggered', { trip_id: tripId }),
};

export default analytics;
