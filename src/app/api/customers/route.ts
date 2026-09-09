import { NextResponse } from "next/server";

import { requireApiPermission } from "../_helpers";
import { listCustomers } from "@/server/services/customer.service";

export async function GET() {
  const auth = await requireApiPermission("customers:read");
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ customers: await listCustomers() });
}
