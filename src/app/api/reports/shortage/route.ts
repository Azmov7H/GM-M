import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { getShortageReport } from "@/server/services/report.service";

export async function GET() {
  const auth = await requireApiPermission("reports:view");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ rows: await getShortageReport() });
}
