import { describe, it, expect, vi, beforeAll } from "vitest";

const cookieStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
  }),
}));

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import { db } from "@/server/db";
import { login, logout, changePasswordForUser } from "./auth.service";
import { resetLoginRateLimit } from "@/lib/auth/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-token";
import { createUser } from "@/server/db/factories";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-for-vitest-only-32bytes!";
});

describe("auth.service", () => {
  it("logs in with correct credentials and sets a session cookie", async () => {
    const tag = Math.random().toString(36).slice(2, 8);
    const username = `admin_${tag}`;
    await createUser(db, {
      username,
      displayName: "المدير",
      passwordHash: await hashPassword("secret123"),
    });

    const result = await login(username, "secret123");
    expect(result.success).toBe(true);
    expect(cookieStore.get(SESSION_COOKIE_NAME)).toBeTruthy();
  });

  it("rejects wrong passwords and unknown users", async () => {
    const tag = Math.random().toString(36).slice(2, 8);
    const username = `cashier_${tag}`;
    await createUser(db, {
      username,
      displayName: "الكاشير",
      passwordHash: await hashPassword("secret123"),
    });

    expect((await login(username, "wrong")).success).toBe(false);
    expect((await login(`ghost_${tag}`, "secret123")).success).toBe(false);
    resetLoginRateLimit(`login:${username}`);
  });

  it("rate-limits after 5 failed attempts", async () => {
    const tag = Math.random().toString(36).slice(2, 8);
    const username = `locked_${tag}`;
    await createUser(db, {
      username,
      displayName: "مقفل",
      passwordHash: await hashPassword("secret123"),
    });

    for (let i = 0; i < 5; i++) {
      expect((await login(username, "wrong")).success).toBe(false);
    }
    const blocked = await login(username, "wrong");
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    resetLoginRateLimit(`login:${username}`);
  });

  it("changes password and logs in with the new one", async () => {
    const tag = Math.random().toString(36).slice(2, 8);
    const username = `changer_${tag}`;
    const user = await createUser(db, {
      username,
      displayName: "مغيّر",
      passwordHash: await hashPassword("old-pass"),
    });

    const changed = await changePasswordForUser(user.id, "old-pass", "new-pass-123");
    expect(changed.success).toBe(true);
    expect((await login(username, "new-pass-123")).success).toBe(true);
    expect((await login(username, "old-pass")).success).toBe(false);
    expect(
      (await changePasswordForUser(user.id, "bad-current", "another-123")).success,
    ).toBe(false);
    resetLoginRateLimit(`login:${username}`);
  });

  it("logs out and clears the session cookie", async () => {
    const tag = Math.random().toString(36).slice(2, 8);
    const username = `leaver_${tag}`;
    await createUser(db, {
      username,
      displayName: "مغادر",
      passwordHash: await hashPassword("secret123"),
    });
    expect((await login(username, "secret123")).success).toBe(true);
    await logout();
    expect(cookieStore.get(SESSION_COOKIE_NAME)).toBe("");
    resetLoginRateLimit(`login:${username}`);
  });
});
