import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { getProductsMetadata } from "@/server/services/product.service";

export async function GET() {
  const auth = await requireApiPermission("products:read");
  if (auth instanceof NextResponse) return auth;

  const meta = await getProductsMetadata();
  return NextResponse.json(meta);
}
