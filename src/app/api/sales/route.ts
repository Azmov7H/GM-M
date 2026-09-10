import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../_helpers";
import { createSale, listSales } from "@/server/services/sale.service";

const saleItemSchema = z.object({
  productId: z.string().optional().nullable(),
  productName: z.string().trim().optional(),
  quantity: z.coerce.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "السعر غير صالح"),
  warehouseId: z.string().min(1, "المخزن مطلوب"),
  isService: z.boolean().optional(),
});

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "الفاتورة يجب أن تحتوي على صنف واحد على الأقل"),
  customerId: z.string().optional().nullable(),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
  paymentType: z.enum(["cash", "credit", "bank", "wallet", "check"]),
  paidAmount: z.coerce.number().min(0).optional(),
  notes: z.string().trim().nullable().optional().or(z.literal("")),
  allowBelowCost: z.boolean().optional(),
});

export async function GET(req: Request) {
  const auth = await requireApiPermission("invoices:read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const rows = await listSales({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Math.min(Number(url.searchParams.get("limit") ?? 200) || 200, 500),
  });
  return NextResponse.json({ sales: rows });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission("invoices:create");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = createSaleSchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const result = await createSale({
    items: input.data.items,
    customerId: input.data.customerId ?? null,
    discount: input.data.discount ?? 0,
    tax: input.data.tax ?? 0,
    paymentType: input.data.paymentType,
    paidAmount: input.data.paidAmount ?? 0,
    notes: input.data.notes || null,
    allowBelowCost: input.data.allowBelowCost ?? false,
    userId: auth.user.id,
  });
  if (!result.ok) {
    const status = "belowCost" in result && result.belowCost ? 409 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(
    {
      ok: true,
      id: result.id,
      invoiceNumber: result.invoiceNumber,
      total: result.total,
      paymentStatus: result.paymentStatus,
    },
    { status: 201 },
  );
}
