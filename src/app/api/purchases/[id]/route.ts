import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiPermission } from "../../_helpers";
import {
  cancelPurchase,
  getPurchase,
  receivePurchase,
} from "@/server/services/purchase.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const receiveSchema = z.object({
  items: z
    .array(z.object({ itemId: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1),
});

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("purchases:read");
  if (auth instanceof NextResponse) return auth;
  const row = await getPurchase(id);
  if (!row) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({ purchase: row });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("purchases:delete");
  if (auth instanceof NextResponse) return auth;
  const result = await cancelPurchase(id, auth.user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function POST(req: Request, ctx: RouteContext) {
  await ctx.params;
  const auth = await requireApiPermission("purchases:update");
  if (auth instanceof NextResponse) return auth;
  const parsed = await req.json().catch(() => null);
  if (!parsed) return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  const input = receiveSchema.safeParse(parsed);
  if (!input.success)
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  const result = await receivePurchase({ items: input.data.items }, auth.user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
