import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { resetUserPassword } from "@/server/services/auth.service";
import { newTempPassword } from "@/server/services/user.service";
import { findById } from "@/server/repositories/user-repository";

const resetSchema = z.object({
  newPassword: z.string().min(6, "كلمة المرور 6 أحرف على الأقل").optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasPermission(user.permissions, "users:update")) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }

  const target = await findById(id);
  if (!target) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const newPassword = parsed.data.newPassword ?? newTempPassword();
  await resetUserPassword(id, newPassword);
  return NextResponse.json({
    ok: true,
    tempPassword: parsed.data.newPassword ? undefined : newPassword,
  });
}
