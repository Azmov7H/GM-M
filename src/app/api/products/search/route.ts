import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { listProducts } from "@/server/services/product.service";

export async function GET(req: Request) {
  const auth = await requireApiPermission("products:read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ products: [] });
  }
  const rows = await listProducts({ search: q });
  return NextResponse.json({ products: rows.slice(0, 20) });
}
