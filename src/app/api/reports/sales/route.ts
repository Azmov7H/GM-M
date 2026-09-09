import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { getSalesReport } from "@/server/services/report.service";

export async function GET(req: Request) {
  const auth = await requireApiPermission("reports:view");
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  return NextResponse.json({
    report: await getSalesReport({
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    }),
  });
}
