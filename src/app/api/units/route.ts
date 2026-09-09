import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../_helpers";
import { createUnit, listUnits } from "@/server/services/unit.service";

const unitSchema = z.object({
  name: z.string().trim().min(1, "اسم الوحدة مطلوب"),
  nameShort: z.string().trim().min(1, "مختصر الوحدة مطلوب"),
});

export async function GET() {
  const auth = await requireApiPermission("products:read");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ units: await listUnits() });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission("products:create");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = unitSchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }
  const result = await createUnit(input.data, auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
