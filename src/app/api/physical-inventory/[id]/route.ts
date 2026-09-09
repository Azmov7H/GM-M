import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../../_helpers";
import { getCount, updateCounts } from "@/server/services/physical-inventory.service";

const updateCountsSchema = z.object({
  counts: z
    .array(
      z.object({
        itemId: z.string().min(1),
        countedQuantity: z.coerce.number().int().min(0),
      }),
    )
    .min(1, "لا توجد أصناف لتحديثها"),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("physical_inventory:manage");
  if (auth instanceof NextResponse) return auth;

  const count = await getCount(id);
  if (!count) {
    return NextResponse.json({ error: "جلسة الجرد غير موجودة" }, { status: 404 });
  }
  return NextResponse.json({ count });
}

export async function PUT(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("physical_inventory:manage");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = updateCountsSchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }
  const result = await updateCounts(id, input.data.counts, auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
