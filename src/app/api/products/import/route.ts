import { NextResponse } from "next/server";

import { requireApiPermission } from "../../_helpers";
import { importProductsCsv } from "@/server/services/product-io.service";

const MAX_CSV_BYTES = 2 * 1024 * 1024;

export async function POST(req: Request) {
  const auth = await requireApiPermission("products:create");
  if (auth instanceof NextResponse) return auth;

  let file: File | null = null;
  try {
    const form = await req.formData();
    const value = form.get("file");
    if (value instanceof File) file = value;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "اختر ملف CSV أولاً" }, { status: 400 });
  }
  if (file.size > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "حجم الملف يتجاوز 2MB" }, { status: 400 });
  }

  const text = await file.text();
  if (!text.trim()) {
    return NextResponse.json({ error: "الملف فارغ" }, { status: 400 });
  }

  const result = await importProductsCsv(text, auth.user.id);
  return NextResponse.json({ result });
}
