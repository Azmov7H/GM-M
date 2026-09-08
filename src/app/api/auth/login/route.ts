import { NextResponse } from "next/server";
import { z } from "zod";

import { login } from "@/server/services/auth.service";

const loginSchema = z.object({
  username: z.string().trim().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const result = await login(parsed.data.username, parsed.data.password, ip);

  if (!result.success) {
    const status = result.retryAfterSeconds ? 429 : 401;
    return NextResponse.json(
      {
        error: result.error,
        retryAfterSeconds: result.retryAfterSeconds,
        attemptsLeft: result.attemptsLeft,
      },
      { status },
    );
  }

  return NextResponse.json({ ok: true });
}
