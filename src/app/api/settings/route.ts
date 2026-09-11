import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireApiPermission } from "../_helpers";
import {
  getSettings,
  isSettingKey,
  updateSettings,
} from "@/server/services/settings.service";

const patchSchema = z
  .record(z.string(), z.string())
  .refine((obj) => Object.keys(obj).length > 0 && Object.keys(obj).every(isSettingKey), {
    message: "إعدادات غير صالحة",
  });

export async function GET() {
  const auth = await requireApiPermission("users:read");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: Request) {
  const auth = await requireApiPermission("users:update");
  if (auth instanceof NextResponse) return auth;

  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const input = patchSchema.safeParse(parsed.body);
  if (!input.success) {
    return NextResponse.json(
      { error: input.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }
  const result = await updateSettings(input.data, auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ settings: await getSettings() });
}
