import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_DURATION_SECONDS = 24 * 60 * 60;

export function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  iat: number;
  exp: number;
}

// In-memory revocation watermark (e.g. after a database restore all
// pre-existing tokens stop validating). Reset on process restart.
let invalidatedBeforeMs = 0;

export function invalidateAllSessions(now = Date.now()): void {
  invalidatedBeforeMs = now;
}

export async function signSessionToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_DURATION_SECONDS)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    const userId = payload.userId;
    if (typeof userId !== "string" || !userId) return null;
    if (typeof payload.iat === "number" && payload.iat * 1000 < invalidatedBeforeMs) {
      return null;
    }
    return {
      userId,
      iat: typeof payload.iat === "number" ? payload.iat : 0,
      exp: typeof payload.exp === "number" ? payload.exp : 0,
    };
  } catch {
    return null;
  }
}
