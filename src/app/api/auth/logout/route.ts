import { NextResponse } from "next/server";

import { logout } from "@/server/services/auth.service";

export async function POST() {
  await logout();
  return NextResponse.json({ ok: true });
}
