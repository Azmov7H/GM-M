import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { listBackups } from "@/server/services/backup.service";

export async function GET() {
  const auth = await requireApiPermission("backup:create");
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ backups: listBackups() });
}
