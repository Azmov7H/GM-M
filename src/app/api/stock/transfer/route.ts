import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../../_helpers";
import { transferStock } from "@/server/services/stock.service";

const transferSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
  fromWarehouseId: z.string().min(1, "مخزن المصدر مطلوب"),
  toWarehouseId: z.string().min(1, "مخزن الوجهة مطلوب"),
  quantity: z.coerce.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const auth = await requireApiPermission("stock:transfer");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = transferSchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }
  const result = await transferStock({
    productId: input.data.productId,
    fromWarehouseId: input.data.fromWarehouseId,
    toWarehouseId: input.data.toWarehouseId,
    quantity: input.data.quantity,
    notes: input.data.notes || null,
    userId: auth.user.id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
