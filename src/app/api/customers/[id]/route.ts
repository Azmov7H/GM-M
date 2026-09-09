import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../../_helpers";
import {
  deactivateCustomer,
  getCustomerDetail,
  updateCustomer,
} from "@/server/services/party.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const partySchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب"),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
});

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("customers:read");
  if (auth instanceof NextResponse) return auth;
  const row = await getCustomerDetail(id);
  if (!row) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
  return NextResponse.json({ customer: row });
}

export async function PUT(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("customers:update");
  if (auth instanceof NextResponse) return auth;
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  const input = partySchema.safeParse(parsed.body);
  if (!input.success)
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  const result = await updateCustomer(id, input.data, auth.user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("customers:delete");
  if (auth instanceof NextResponse) return auth;
  const result = await deactivateCustomer(id, auth.user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
