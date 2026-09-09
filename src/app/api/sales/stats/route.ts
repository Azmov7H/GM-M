import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { getSalesStats } from "@/server/services/sale.service";

export async function GET() {
  const auth = await requireApiPermission("invoices:read");
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ stats: await getSalesStats() });
}
