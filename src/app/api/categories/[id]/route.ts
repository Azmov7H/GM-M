import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../../_helpers";
import { deleteCategory, updateCategory } from "@/server/services/category.service";

const updateCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("products:update");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = updateCategorySchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }
  const result = await updateCategory(id, input.data, auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("products:delete");
  if (auth instanceof NextResponse) return auth;

  const result = await deleteCategory(id, auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
