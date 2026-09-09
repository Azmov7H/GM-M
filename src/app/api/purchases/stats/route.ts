import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { getPurchaseStats } from "@/server/services/purchase.service";

export async function GET() {
  const auth = await requireApiPermission("purchases:read");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ stats: await getPurchaseStats() });
}
