import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../_helpers";
import {
  createProduct,
  listProducts,
  suggestProductCode,
} from "@/server/services/product.service";

const createProductSchema = z.object({
  code: z.string().trim().min(1, "رمز المنتج مطلوب").optional(),
  name: z.string().trim().min(1, "اسم المنتج مطلوب"),
  description: z.string().trim().optional().or(z.literal("")),
  categoryId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  buyPrice: z.coerce.number().min(0, "سعر الشراء يجب أن يكون صفراً أو أكثر"),
  retailPrice: z.coerce.number().min(0, "سعر البيع يجب أن يكون صفراً أو أكثر"),
  wholesalePrice: z.coerce.number().min(0).optional().nullable(),
  specialPrice: z.coerce.number().min(0).optional().nullable(),
  minLevel: z.coerce.number().int().min(0).optional().nullable(),
});

export async function GET(req: Request) {
  const auth = await requireApiPermission("products:read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const rows = await listProducts({
    search: url.searchParams.get("search") ?? undefined,
    categoryId: url.searchParams.get("categoryId") ?? undefined,
  });
  return NextResponse.json({ products: rows });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission("products:create");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = createProductSchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const result = await createProduct(
    {
      code: input.data.code || suggestProductCode(),
      name: input.data.name,
      description: input.data.description || null,
      categoryId: input.data.categoryId ?? null,
      unitId: input.data.unitId ?? null,
      buyPrice: input.data.buyPrice,
      retailPrice: input.data.retailPrice,
      wholesalePrice: input.data.wholesalePrice ?? null,
      specialPrice: input.data.specialPrice ?? null,
      minLevel: input.data.minLevel ?? 5,
    },
    auth.user.id,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
