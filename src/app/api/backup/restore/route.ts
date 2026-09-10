import { NextResponse } from "next/server";

import { requireApiPermission, parseJsonBody } from "../../_helpers";
import { restoreBackup } from "@/server/services/backup.service";
import { destroySession } from "@/lib/auth/session";
import { invalidateAllSessions } from "@/lib/auth/session-token";

export async function POST(req: Request) {
  const auth = await requireApiPermission("backup:restore");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const body = parsed.body as { filename?: unknown; confirm?: unknown };
  if (typeof body.filename !== "string" || body.confirm !== true) {
    return NextResponse.json(
      { error: "الاستعادة تتطلب تحديد الملف والتأكيد الصريح" },
      { status: 400 },
    );
  }

  const result = await restoreBackup(body.filename);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Restored DB has its own sessions table: the current session is invalid.
  // Clear the cookie and revoke all pre-restore JWTs (stateless sessions).
  invalidateAllSessions();
  try {
    await destroySession();
  } catch {
    // The restored DB may already lack the session; cookie clear is enough.
  }
  return NextResponse.json({ ok: true, safetyCopy: result.safetyCopy });
}
