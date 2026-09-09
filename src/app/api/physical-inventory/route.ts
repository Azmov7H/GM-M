import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../_helpers";
import { createCount, listCounts } from "@/server/services/physical-inventory.service";

const createCountSchema = z.object({
  name: z.string().trim().min(1, "اسم الجرد مطلوب"),
  warehouseId: z.string().optional().nullable(),
  notes: z.string().trim().optional().or(z.literal("")),
});

export async function GET() {
  const auth = await requireApiPermission("physical_inventory:manage");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ counts: await listCounts() });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission("physical_inventory:manage");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = createCountSchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }
  const result = await createCount({
    name: input.data.name,
    warehouseId: input.data.warehouseId ?? null,
    notes: input.data.notes || null,
    userId: auth.user.id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
