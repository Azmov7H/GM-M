import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../_helpers";
import { createCategory, listCategories } from "@/server/services/category.service";

const categorySchema = z.object({
  name: z.string().trim().min(1, "اسم الفئة مطلوب"),
  parentId: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function GET() {
  const auth = await requireApiPermission("products:read");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ categories: await listCategories() });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission("products:create");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = categorySchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }
  const result = await createCategory(
    {
      name: input.data.name,
      parentId: input.data.parentId ?? null,
      sortOrder: input.data.sortOrder,
    },
    auth.user.id,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
