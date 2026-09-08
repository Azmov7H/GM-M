import { randomUUID } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "./session-token";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export async function createSession(userId: string): Promise<void> {
  const id = `session_${randomUUID().slice(0, 8)}`;
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();

  await db.insert(sessions).values({ id, userId, expiresAt });

  const token = await signSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, cookieOptions());
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getSessionUserId(): Promise<string | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const payload = await verifySessionToken(token);
  return payload?.userId ?? null;
}

export async function destroySession(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) {
      const now = new Date().toISOString();
      await db
        .delete(sessions)
        .where(and(eq(sessions.userId, payload.userId), gt(sessions.expiresAt, now)));
    }
  }
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0 });
}

export async function refreshSession(): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) return;
  const token = await signSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, cookieOptions());
}
