"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SettingsMap = Record<string, string>;

const TEXT_KEYS = [
  { key: "company.name", label: "اسم الشركة", placeholder: "مؤسستي" },
  { key: "company.phone", label: "الهاتف", placeholder: "05xxxxxxxx" },
  { key: "company.address", label: "العنوان", placeholder: "المدينة، الحي، الشارع" },
  { key: "company.footer", label: "تذييل الفاتورة", placeholder: "شكراً لتسوقكم معنا" },
  { key: "company.currency", label: "العملة", placeholder: "ر.س" },
] as const;

const BOOL_KEYS = [
  { key: "invoice.show_customer", label: "إظهار العميل في الفاتورة" },
  { key: "invoice.show_payment", label: "إظهار طريقة الدفع" },
  { key: "invoice.show_cashier", label: "إظهار البائع" },
  { key: "sale.allow_below_cost", label: "السماح بالبيع بأقل من سعر التكلفة" },
] as const;

export function CompanySettingsForm({ initial }: { initial: SettingsMap }) {
  const [values, setValues] = React.useState<SettingsMap>(initial);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await res.json()) as {
        settings?: SettingsMap;
        error?: string;
      };
      if (!res.ok) {
        setError(body.error ?? "تعذر الحفظ");
        return;
      }
      if (body.settings) setValues(body.settings);
      setNotice("تم حفظ الإعدادات");
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEXT_KEYS.map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`setting-${key}`}>{label}</Label>
            <Input
              id={`setting-${key}`}
              value={values[key] ?? ""}
              placeholder={placeholder}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setting-invoice-template">قالب الفاتورة</Label>
          <Select
            value={values["invoice.template"] ?? "standard"}
            onValueChange={(v) => set("invoice.template", v ?? "standard")}
          >
            <SelectTrigger id="setting-invoice-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">قياسي</SelectItem>
              <SelectItem value="compact">مدمج</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setting-invoice-paper">مقاس الورق</Label>
          <Select
            value={values["invoice.paper"] ?? "a4"}
            onValueChange={(v) => set("invoice.paper", v ?? "a4")}
          >
            <SelectTrigger id="setting-invoice-paper">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4">A4</SelectItem>
              <SelectItem value="80mm">طابعة حرارية 80مم</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BOOL_KEYS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`setting-${key}`}>{label}</Label>
            <Select
              value={values[key] ?? "false"}
              onValueChange={(v) => set(key, v ?? "false")}
            >
              <SelectTrigger id={`setting-${key}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">نعم</SelectItem>
                <SelectItem value="false">لا</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {notice && (
        <p
          role="status"
          className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}
      <div>
        <Button onClick={save} disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>
    </div>
  );
}
