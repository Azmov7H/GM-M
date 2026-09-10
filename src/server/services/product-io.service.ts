import { listProducts, createProduct, updateProduct } from "./product.service";
import { listCategories } from "./category.service";
import { listUnits } from "./unit.service";

export const PRODUCT_CSV_HEADERS = [
  "code",
  "name",
  "description",
  "unit",
  "category",
  "buyPrice",
  "retailPrice",
  "wholesalePrice",
  "minLevel",
  "isActive",
] as const;

/** Minimal RFC-4180 reader: quotes, escaped quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    // Skip fully empty trailing lines.
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      if (field === "") {
        inQuotes = true;
      } else {
        field += c;
      }
    } else if (c === ",") {
      pushField();
    } else if (c === "\n") {
      pushRow();
    } else if (c === "\r") {
      // Ignore; \n handles the break.
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) pushRow();
  return rows;
}

function escapeCsvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export interface ProductExportRow {
  code: string;
  name: string;
  description: string | null;
  unitName: string | null;
  categoryName: string | null;
  buyPrice: number;
  retailPrice: number;
  wholesalePrice: number | null;
  minLevel: number | null;
  isActive: boolean;
}

export function serializeProductsCsv(rows: ProductExportRow[]): string {
  const lines = [PRODUCT_CSV_HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.code,
        r.name,
        r.description ?? "",
        r.unitName ?? "",
        r.categoryName ?? "",
        String(r.buyPrice),
        String(r.retailPrice),
        r.wholesalePrice == null ? "" : String(r.wholesalePrice),
        r.minLevel == null ? "" : String(r.minLevel),
        r.isActive ? "1" : "0",
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  return "﻿" + lines.join("\n") + "\n";
}

export async function exportProductsCsv(): Promise<string> {
  const products = await listProducts();
  return serializeProductsCsv(
    products.map((p) => ({
      code: p.code,
      name: p.name,
      description: p.description,
      unitName: p.unitName,
      categoryName: p.categoryName,
      buyPrice: p.buyPrice,
      retailPrice: p.retailPrice,
      wholesalePrice: p.wholesalePrice,
      minLevel: p.minLevel,
      isActive: p.isActive,
    })),
  );
}

export interface ImportRowError {
  row: number;
  code: string;
  message: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: ImportRowError[];
}

function parseNumber(
  raw: string,
  field: string,
): { ok: true; value: number } | { ok: false; error: string } {
  if (raw === "") return { ok: true, value: 0 };
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: `${field}: قيمة غير صالحة` };
  }
  return { ok: true, value };
}

function parseActive(
  raw: string,
): { ok: true; value: boolean } | { ok: false; error: string } {
  const v = raw.trim().toLowerCase();
  if (v === "" || ["1", "true", "yes", "نعم"].includes(v))
    return { ok: true, value: true };
  if (["0", "false", "no", "لا"].includes(v)) return { ok: true, value: false };
  return { ok: false, error: "الحالة: قيمة غير صالحة (استخدم 1 أو 0)" };
}

export async function importProductsCsv(
  text: string,
  userId?: string,
): Promise<ImportResult> {
  const rows = parseCsv(text);
  const errors: ImportRowError[] = [];
  if (rows.length === 0) {
    return { total: 0, imported: 0, failed: 0, errors };
  }
  const header = rows[0].map((h) => h.trim());
  const missing = ["code", "name"].filter((h) => !header.includes(h));
  if (missing.length > 0) {
    return {
      total: 0,
      imported: 0,
      failed: 0,
      errors: [{ row: 1, code: "", message: `العناوين ناقصة: ${missing.join("، ")}` }],
    };
  }
  const col = (name: string) => header.indexOf(name);
  const cell = (r: string[], name: string) =>
    col(name) === -1 ? "" : (r[col(name)] ?? "").trim();

  const [categories, units] = await Promise.all([listCategories(), listUnits()]);
  const categoryByName = new Map(categories.map((c) => [c.name, c.id]));
  const unitByName = new Map(units.map((u) => [u.name, u.id]));

  const seenCodes = new Set<string>();
  let imported = 0;
  const dataRows = rows.slice(1);
  for (let i = 0; i < dataRows.length; i++) {
    const lineNo = i + 2;
    const r = dataRows[i];
    if (r.every((c) => c.trim() === "")) continue;
    const code = cell(r, "code");
    const name = cell(r, "name");
    const fail = (message: string) => {
      errors.push({ row: lineNo, code, message });
    };

    if (!code) {
      fail("رمز المنتج مطلوب");
      continue;
    }
    if (!name) {
      fail("اسم المنتج مطلوب");
      continue;
    }
    if (seenCodes.has(code)) {
      fail("رمز مكرر داخل الملف");
      continue;
    }
    seenCodes.add(code);

    const unitName = cell(r, "unit");
    const categoryName = cell(r, "category");
    if (unitName && !unitByName.has(unitName)) {
      fail(`الوحدة غير موجودة: ${unitName}`);
      continue;
    }
    if (categoryName && !categoryByName.has(categoryName)) {
      fail(`الفئة غير موجودة: ${categoryName}`);
      continue;
    }
    const buy = parseNumber(cell(r, "buyPrice"), "سعر الشراء");
    if (!buy.ok) {
      fail(buy.error);
      continue;
    }
    const retail = parseNumber(cell(r, "retailPrice"), "سعر البيع");
    if (!retail.ok) {
      fail(retail.error);
      continue;
    }
    const wholesaleRaw = cell(r, "wholesalePrice");
    const wholesale =
      wholesaleRaw === ""
        ? { ok: true as const, value: 0 }
        : parseNumber(wholesaleRaw, "سعر الجملة");
    if (!wholesale.ok) {
      fail(wholesale.error);
      continue;
    }
    const minRaw = cell(r, "minLevel");
    const minLevel =
      minRaw === ""
        ? { ok: true as const, value: 5 }
        : parseNumber(minRaw, "الحد الأدنى");
    if (!minLevel.ok) {
      fail(minLevel.error);
      continue;
    }
    const active = parseActive(cell(r, "isActive"));
    if (!active.ok) {
      fail(active.error);
      continue;
    }

    const created = await createProduct(
      {
        code,
        name,
        description: cell(r, "description") || null,
        categoryId: categoryName ? (categoryByName.get(categoryName) ?? null) : null,
        unitId: unitName ? (unitByName.get(unitName) ?? null) : null,
        buyPrice: buy.value,
        retailPrice: retail.value,
        wholesalePrice: wholesaleRaw === "" ? null : wholesale.value,
        minLevel: minLevel.value,
      },
      userId,
    );
    if (!created.ok) {
      fail(created.error);
      continue;
    }
    if (!active.value) {
      await updateProduct(created.id, { isActive: false }, userId);
    }
    imported++;
  }

  const total = dataRows.filter((r) => !r.every((c) => c.trim() === "")).length;
  return { total, imported, failed: errors.length, errors };
}
