import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import {
  checkLoginRateLimit,
  resetLoginRateLimit,
  type RateLimitResult,
} from "@/lib/auth/rate-limit";
import { findByUsername } from "@/server/repositories/user-repository";

export interface LoginResult {
  success: boolean;
  error?: string;
  retryAfterSeconds?: number;
  attemptsLeft?: number;
}

export async function login(
  username: string,
  password: string,
  _ip?: string,
): Promise<LoginResult> {
  const rateKey = `login:${username.toLowerCase()}`;

  const rate: RateLimitResult = checkLoginRateLimit(rateKey);
  if (!rate.allowed) {
    return {
      success: false,
      error: "محاولات تسجيل الدخول كثيرة. حاول مرة أخرى لاحقاً.",
      retryAfterSeconds: rate.retryAfterSeconds,
    };
  }

  const user = await findByUsername(username.toLowerCase());
  if (!user || !user.isActive) {
    return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return {
      success: false,
      error: "اسم المستخدم أو كلمة المرور غير صحيحة",
      attemptsLeft: rate.attemptsLeft,
    };
  }

  resetLoginRateLimit(rateKey);
  await createSession(user.id);

  return { success: true };
}

export async function logout(): Promise<void> {
  await destroySession();
}

export async function changePasswordForUser(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];
  if (!user) return { success: false, error: "المستخدم غير موجود" };

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { success: false, error: "كلمة المرور الحالية غير صحيحة" };

  const hashed = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hashed }).where(eq(users.id, userId));
  return { success: true };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
  actor?: { id: string; roles: string[] },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { getUserRoles } = await import("@/server/repositories/user-repository");
  const { logAudit } = await import("./audit.service");
  const targetRoles = await getUserRoles(userId);
  if (targetRoles.includes("owner") && !actor?.roles.includes("owner")) {
    return { ok: false, error: "لا يمكن إعادة تعيين كلمة مرور المالك" };
  }
  const hashed = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hashed }).where(eq(users.id, userId));
  await logAudit({
    userId: actor?.id,
    action: "reset-password",
    resource: "users",
    resourceId: userId,
  });
  return { ok: true };
}
