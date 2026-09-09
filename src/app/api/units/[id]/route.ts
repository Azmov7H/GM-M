import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../../_helpers";
import { deleteUnit, updateUnit } from "@/server/services/unit.service";

const updateUnitSchema = z.object({
  name: z.string().trim().min(1).optional(),
  nameShort: z.string().trim().min(1).optional(),
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
  const input = updateUnitSchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }
  const result = await updateUnit(id, input.data, auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("products:delete");
  if (auth instanceof NextResponse) return auth;

  const result = await deleteUnit(id, auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
