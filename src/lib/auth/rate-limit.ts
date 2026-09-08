export interface RateLimitResult {
  allowed: boolean;
  attemptsLeft: number;
  retryAfterSeconds: number;
}

interface Window {
  count: number;
  firstAttemptAt: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const windows = new Map<string, Window>();

export function checkLoginRateLimit(key: string, now = Date.now()): RateLimitResult {
  let window = windows.get(key);
  if (!window) {
    window = { count: 1, firstAttemptAt: now };
    windows.set(key, window);
    return { allowed: true, attemptsLeft: MAX_ATTEMPTS - 1, retryAfterSeconds: 0 };
  }

  if (now - window.firstAttemptAt > WINDOW_MS) {
    window.count = 1;
    window.firstAttemptAt = now;
    return { allowed: true, attemptsLeft: MAX_ATTEMPTS - 1, retryAfterSeconds: 0 };
  }

  window.count += 1;
  const allowed = window.count <= MAX_ATTEMPTS;
  const retryAfterSeconds = Math.max(
    0,
    Math.ceil((window.firstAttemptAt + WINDOW_MS - now) / 1000),
  );
  return {
    allowed,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - window.count),
    retryAfterSeconds,
  };
}

export function resetLoginRateLimit(key: string): void {
  windows.delete(key);
}

export function clearExpiredWindows(now = Date.now()): void {
  for (const [key, window] of windows) {
    if (now - window.firstAttemptAt > WINDOW_MS) {
      windows.delete(key);
    }
  }
}
