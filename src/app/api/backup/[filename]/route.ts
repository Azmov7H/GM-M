import { createReadStream, statSync } from "fs";

import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { resolveBackupPath } from "@/server/services/backup.service";

interface RouteContext {
  params: Promise<{ filename: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const auth = await requireApiPermission("backup:create");
  if (auth instanceof NextResponse) return auth;

  const { filename } = await ctx.params;
  const path = resolveBackupPath(filename);
  if (!path) {
    return NextResponse.json({ error: "اسم ملف غير صالح" }, { status: 400 });
  }

  let size: number;
  try {
    size = statSync(path).size;
  } catch {
    return NextResponse.json({ error: "ملف النسخة غير موجود" }, { status: 404 });
  }

  const stream = createReadStream(path);
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
