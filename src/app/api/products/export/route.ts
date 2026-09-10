import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { exportProductsCsv } from "@/server/services/product-io.service";

export async function GET() {
  const auth = await requireApiPermission("products:read");
  if (auth instanceof NextResponse) return auth;

  const csv = await exportProductsCsv();
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${stamp}.csv"`,
    },
  });
}
