import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../../_helpers";
import {
  deleteProduct,
  getProduct,
  updateProduct,
} from "@/server/services/product.service";

const updateProductSchema = z.object({
  code: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional().or(z.literal("")),
  categoryId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  buyPrice: z.coerce.number().min(0).optional(),
  retailPrice: z.coerce.number().min(0).optional(),
  wholesalePrice: z.coerce.number().min(0).nullable().optional(),
  specialPrice: z.coerce.number().min(0).nullable().optional(),
  minLevel: z.coerce.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("products:read");
  if (auth instanceof NextResponse) return auth;

  const product = await getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PUT(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("products:update");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = updateProductSchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const result = await updateProduct(
    id,
    {
      ...input.data,
      description: input.data.description === "" ? null : input.data.description,
    },
    auth.user.id,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("products:delete");
  if (auth instanceof NextResponse) return auth;

  const result = await deleteProduct(id, auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
