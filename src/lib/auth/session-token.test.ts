import { describe, it, expect, beforeAll, vi } from "vitest";

import {
  signSessionToken,
  verifySessionToken,
  invalidateAllSessions,
  SESSION_DURATION_SECONDS,
} from "./session-token";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-for-vitest-only-32bytes!";
});

describe("session-token", () => {
  it("signs and verifies a token", async () => {
    const token = await signSessionToken("user_123");
    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe("user_123");
    expect(payload!.exp - payload!.iat).toBe(SESSION_DURATION_SECONDS);
  });

  it("rejects a tampered token", async () => {
    const token = await signSessionToken("user_123");
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects an empty token", async () => {
    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });

  it("revokes pre-existing tokens after invalidateAllSessions", async () => {
    try {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-10T00:00:00Z"));
      const token = await signSessionToken("user_123");
      expect(await verifySessionToken(token)).not.toBeNull();
      vi.setSystemTime(new Date("2026-09-10T00:00:02Z"));
      invalidateAllSessions();
      expect(await verifySessionToken(token)).toBeNull();
      // Tokens issued after the revocation stay valid.
      const fresh = await signSessionToken("user_123");
      expect(await verifySessionToken(fresh)).not.toBeNull();
    } finally {
      vi.useRealTimers();
      invalidateAllSessions(0);
    }
  });
});
