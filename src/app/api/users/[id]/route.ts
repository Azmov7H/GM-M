import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import {
  assignUserRoles,
  deactivateUser,
  getUserDetail,
  OWNER_GRANT_DENIED,
  OWNER_MANAGE_DENIED,
  updateUser,
} from "@/server/services/user.service";

const updateUserSchema = z.object({
  displayName: z.string().trim().min(1).optional(),
  email: z.string().trim().email("بريد غير صالح").nullable().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasPermission(user.permissions, "users:read")) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }
  const detail = await getUserDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ user: detail });
}

export async function PUT(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasPermission(user.permissions, "users:update")) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const result = await updateUser(
    id,
    {
      displayName: parsed.data.displayName,
      email: parsed.data.email === "" ? null : parsed.data.email,
      isActive: parsed.data.isActive,
    },
    { id: user.id, roles: user.roles },
  );
  if (!result.ok) {
    const status =
      result.error === OWNER_MANAGE_DENIED || result.error === OWNER_GRANT_DENIED
        ? 403
        : 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  if (parsed.data.roleIds !== undefined) {
    const rolesResult = await assignUserRoles(id, parsed.data.roleIds, {
      id: user.id,
      roles: user.roles,
    });
    if (!rolesResult.ok) {
      const status =
        rolesResult.error === OWNER_MANAGE_DENIED ||
        rolesResult.error === OWNER_GRANT_DENIED
          ? 403
          : 404;
      return NextResponse.json({ error: rolesResult.error }, { status });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasPermission(user.permissions, "users:update")) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }

  const result = await deactivateUser(id, user.id, { id: user.id, roles: user.roles });
  if (!result.ok) {
    const status = result.error === OWNER_MANAGE_DENIED ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true });
}
