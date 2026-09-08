import { describe, it, expect, beforeEach } from "vitest";

import { checkLoginRateLimit, resetLoginRateLimit } from "./rate-limit";

describe("login rate limit", () => {
  beforeEach(() => {
    resetLoginRateLimit("test-user");
  });

  it("allows the first 5 attempts", () => {
    for (let i = 1; i <= 5; i++) {
      const r = checkLoginRateLimit("test-user");
      expect(r.allowed).toBe(true);
      expect(r.attemptsLeft).toBe(5 - i);
    }
  });

  it("blocks the 6th attempt within the window", () => {
    for (let i = 0; i < 5; i++) checkLoginRateLimit("test-user");
    const blocked = checkLoginRateLimit("test-user");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window expires", () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) checkLoginRateLimit("test-user", now);
    expect(checkLoginRateLimit("test-user", now).allowed).toBe(false);
    const afterWindow = now + 16 * 60 * 1000;
    const r = checkLoginRateLimit("test-user", afterWindow);
    expect(r.allowed).toBe(true);
    expect(r.attemptsLeft).toBe(4);
  });

  it("resetLoginRateLimit clears the counter", () => {
    for (let i = 0; i < 5; i++) checkLoginRateLimit("test-user");
    resetLoginRateLimit("test-user");
    expect(checkLoginRateLimit("test-user").allowed).toBe(true);
  });
});
