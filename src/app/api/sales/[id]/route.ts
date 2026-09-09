import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { getSale } from "@/server/services/sale.service";
import { cancelSale } from "@/server/services/sale-return.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("invoices:read");
  if (auth instanceof NextResponse) return auth;

  const sale = await getSale(id);
  if (!sale) {
    return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
  }
  return NextResponse.json({ sale });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("invoices:delete");
  if (auth instanceof NextResponse) return auth;

  const result = await cancelSale(id, auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
