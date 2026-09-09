import { NextResponse } from "next/server";

import { requireApiPermission } from "../../../_helpers";
import { approveCount } from "@/server/services/physical-inventory.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = await requireApiPermission("physical_inventory:manage");
  if (auth instanceof NextResponse) return auth;

  const result = await approveCount(id, auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, adjusted: result.adjusted });
}
