import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../../_helpers";
import { adjustStock } from "@/server/services/stock.service";

const adjustSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
  warehouseId: z.string().min(1, "المخزن مطلوب"),
  quantity: z.coerce.number().int().min(0, "الكمية يجب أن تكون صفراً أو أكثر"),
  reason: z.string().trim().min(1, "سبب التسوية مطلوب"),
});

export async function POST(req: Request) {
  const auth = await requireApiPermission("stock:manage");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = adjustSchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }
  const result = await adjustStock({
    productId: input.data.productId,
    warehouseId: input.data.warehouseId,
    quantity: input.data.quantity,
    reason: input.data.reason,
    userId: auth.user.id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
