import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../_helpers";
import { createPurchase, listPurchases } from "@/server/services/purchase.service";

const createSchema = z.object({
  supplierId: z.string().min(1, "المورد مطلوب"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        unitCost: z.number().nonnegative(),
      }),
    )
    .min(1),
  tax: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET() {
  const auth = await requireApiPermission("purchases:read");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ purchases: await listPurchases() });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission("purchases:create");
  if (auth instanceof NextResponse) return auth;
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  const input = createSchema.safeParse(parsed.body);
  if (!input.success)
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  const result = await createPurchase({ ...input.data, userId: auth.user.id });
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
