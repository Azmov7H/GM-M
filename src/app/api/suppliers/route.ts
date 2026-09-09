import { NextResponse } from "next/server";

import { requireApiPermission } from "../_helpers";
import { db } from "@/server/db";
import { suppliers } from "@/server/db/schema";

export async function GET() {
  const auth = await requireApiPermission("purchases:read");
  if (auth instanceof NextResponse) return auth;
  const list = await db
    .select({ id: suppliers.id, name: suppliers.name })
    .from(suppliers)
    .orderBy(suppliers.name);
  return NextResponse.json({ suppliers: list });
}
