import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../_helpers";
import { createCustomerFull, listCustomersFull } from "@/server/services/party.service";

const partySchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب"),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
});

export async function GET(req: Request) {
  const auth = await requireApiPermission("customers:read");
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  return NextResponse.json({
    customers: await listCustomersFull(url.searchParams.get("search") ?? undefined),
  });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission("customers:create");
  if (auth instanceof NextResponse) return auth;
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  const input = partySchema.safeParse(parsed.body);
  if (!input.success)
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  const result = await createCustomerFull(input.data, auth.user.id);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
