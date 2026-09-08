import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listRoles } from "@/server/services/user.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!hasPermission(user.permissions, "users:read")) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }
  const rows = await listRoles();
  return NextResponse.json({ roles: rows });
}
