import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import {
  createUser,
  listUsers,
  OWNER_GRANT_DENIED,
} from "@/server/services/user.service";

const createUserSchema = z.object({
  username: z.string().trim().min(3, "اسم المستخدم 3 أحرف على الأقل"),
  displayName: z.string().trim().min(1, "الاسم المعروض مطلوب"),
  email: z.string().trim().email("بريد غير صالح").optional().or(z.literal("")),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
  roleIds: z.array(z.string()).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasPermission(user.permissions, "users:read")) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }
  const rows = await listUsers();
  return NextResponse.json({ users: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasPermission(user.permissions, "users:create")) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const result = await createUser(
    {
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      email: parsed.data.email || undefined,
      password: parsed.data.password,
      roleIds: parsed.data.roleIds,
    },
    { id: user.id, roles: user.roles },
  );

  if (!result.ok) {
    const status = result.error === OWNER_GRANT_DENIED ? 403 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
