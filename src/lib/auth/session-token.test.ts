import { describe, it, expect, beforeAll } from "vitest";

import {
  signSessionToken,
  verifySessionToken,
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
});
