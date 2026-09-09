import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../../../_helpers";
import {
  getCustomerDetail,
  recordCustomerPayment,
} from "@/server/services/party.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const paymentSchema = z.object({
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  paymentType: z.enum(["cash", "bank", "wallet", "check"]),
  notes: z.string().trim().optional().nullable(),
});

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("customers:read");
  if (auth instanceof NextResponse) return auth;
  const row = await getCustomerDetail(id);
  if (!row) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
  return NextResponse.json({ payments: row.payments, balance: row.balance });
}

export async function POST(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("customers:update");
  if (auth instanceof NextResponse) return auth;
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  const input = paymentSchema.safeParse(parsed.body);
  if (!input.success)
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  const result = await recordCustomerPayment(
    id,
    input.data.amount,
    input.data.paymentType,
    input.data.notes ?? null,
    auth.user.id,
  );
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
