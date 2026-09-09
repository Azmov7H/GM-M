import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { getDashboard } from "@/server/services/report.service";

export async function GET() {
  const auth = await requireApiPermission("dashboard:view");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ dashboard: await getDashboard() });
}
