import { NextResponse } from "next/server";

import { requireApiPermission } from "../_helpers";
import { getDebtsSummary } from "@/server/services/party.service";

export async function GET() {
  const auth = await requireApiPermission("financial:read");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await getDebtsSummary());
}
