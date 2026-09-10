import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import {
  checkBackupCreateLimit,
  createBackup,
  resetBackupCreateLimit,
} from "@/server/services/backup.service";

export async function POST() {
  const auth = await requireApiPermission("backup:create");
  if (auth instanceof NextResponse) return auth;

  const limit = checkBackupCreateLimit(auth.user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "تجاوزت الحد المسموح (3 نسخ في الساعة)",
        retryAfter: limit.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  try {
    const backup = await createBackup(auth.user.id);
    return NextResponse.json({ backup }, { status: 201 });
  } catch {
    resetBackupCreateLimit(auth.user.id);
    return NextResponse.json({ error: "فشل إنشاء النسخة الاحتياطية" }, { status: 500 });
  }
}
