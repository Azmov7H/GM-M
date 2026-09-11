import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { settings } from "@/server/db/schema";

import { logAudit } from "./audit.service";

export const SETTING_DEFS = {
  "company.name": {
    default: "مؤسستي",
    validate: (v: string) => v.trim().length > 0 && v.length <= 120,
  },
  "company.phone": { default: "", validate: (v: string) => v.length <= 30 },
  "company.address": { default: "", validate: (v: string) => v.length <= 300 },
  "company.footer": { default: "", validate: (v: string) => v.length <= 300 },
  "company.currency": {
    default: "ر.س",
    validate: (v: string) => v.trim().length > 0 && v.length <= 10,
  },
  "invoice.template": {
    default: "standard",
    validate: (v: string) => v === "standard" || v === "compact",
  },
  "invoice.paper": {
    default: "a4",
    validate: (v: string) => v === "a4" || v === "80mm",
  },
  "invoice.show_customer": {
    default: "true",
    validate: (v: string) => v === "true" || v === "false",
  },
  "invoice.show_payment": {
    default: "true",
    validate: (v: string) => v === "true" || v === "false",
  },
  "invoice.show_cashier": {
    default: "true",
    validate: (v: string) => v === "true" || v === "false",
  },
  "sale.allow_below_cost": {
    default: "false",
    validate: (v: string) => v === "true" || v === "false",
  },
} as const;

export type SettingKey = keyof typeof SETTING_DEFS;

export function isSettingKey(key: string): key is SettingKey {
  return key in SETTING_DEFS;
}

const LEGACY_COMPANY_KEY = "store.name";
const LEGACY_FALLBACKS: Partial<Record<SettingKey, string>> = {
  "company.name": "store.name",
  "company.currency": "store.currency",
};

async function readRaw(key: string): Promise<string | undefined> {
  const rows = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return rows[0]?.value;
}

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = Object.fromEntries(
    (Object.keys(SETTING_DEFS) as SettingKey[]).map((k) => [
      k,
      map.get(k) ?? SETTING_DEFS[k].default,
    ]),
  ) as Record<SettingKey, string>;
  if (!map.has("company.name") && map.has(LEGACY_COMPANY_KEY)) {
    out["company.name"] = map.get(LEGACY_COMPANY_KEY)!;
  }
  if (!map.has("company.currency") && map.has("store.currency")) {
    out["company.currency"] = map.get("store.currency")!;
  }
  return out;
}

export async function getSetting(key: SettingKey): Promise<string> {
  const value = await readRaw(key);
  if (value !== undefined) return value;
  // Transparent migration: old DBs carry values under legacy keys.
  const legacyKey = LEGACY_FALLBACKS[key];
  if (legacyKey) {
    const legacy = await readRaw(legacyKey);
    if (legacy !== undefined && legacy.trim().length > 0) return legacy;
  }
  return SETTING_DEFS[key].default;
}

export async function isTruthy(key: SettingKey): Promise<boolean> {
  return (await getSetting(key)) === "true";
}

export async function updateSettings(patch: Record<string, string>, userId?: string) {
  for (const [key, value] of Object.entries(patch)) {
    if (!isSettingKey(key)) {
      return { ok: false as const, error: `إعداد غير معروف: ${key}` };
    }
    if (typeof value !== "string" || !SETTING_DEFS[key].validate(value)) {
      return { ok: false as const, error: `قيمة غير صالحة للإعداد: ${key}` };
    }
  }
  for (const [key, value] of Object.entries(patch)) {
    await db
      .insert(settings)
      .values({ id: `set_${key.replace(/\./g, "_")}`, key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  await logAudit({
    userId,
    action: "update",
    resource: "settings",
    resourceId: Object.keys(patch).join(","),
  });
  return { ok: true as const };
}
