import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";

export async function requireApiPermission(
  permission: string,
): Promise<
  { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> } | NextResponse
> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasPermission(user.permissions, permission)) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }
  return { user };
}

export async function parseJsonBody(
  req: Request,
): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    const body = await req.json();
    return { ok: true, body };
  } catch {
    return { ok: false };
  }
}
