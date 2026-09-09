"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface CountItem {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  systemQuantity: number;
  countedQuantity: number | null;
  variance: number | null;
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    adjusted?: number;
  } | null;
  return { ok: res.ok, error: data?.error ?? null, adjusted: data?.adjusted ?? null };
}

export function CountDetail({
  countId,
  status,
  initialItems,
  editable,
}: {
  countId: string;
  status: string;
  initialItems: CountItem[];
  editable: boolean;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialItems.map((i) => [
        i.id,
        i.countedQuantity !== null ? String(i.countedQuantity) : "",
      ]),
    ),
  );
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const setDraft = (itemId: string, value: string) =>
    setDrafts((d) => ({ ...d, [itemId]: value }));

  const saveCounts = async () => {
    setError(null);
    setNotice(null);
    const counts = Object.entries(drafts)
      .filter(([, v]) => v.trim() !== "")
      .map(([itemId, v]) => ({ itemId, countedQuantity: Math.floor(Number(v)) }));
    if (counts.length === 0) {
      setError("أدخل كمية محسوبة واحدة على الأقل");
      return;
    }
    setSaving(true);
    try {
      const r = await api(`/api/physical-inventory/${countId}`, {
        method: "PUT",
        body: JSON.stringify({ counts }),
      });
      if (!r.ok) {
        setError(r.error ?? "فشل حفظ الكميات");
        return;
      }
      setNotice("تم حفظ الكميات المحسوبة");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action: "complete" | "approve") => {
    setError(null);
    setNotice(null);
    const labels = { complete: "إكمال", approve: "اعتماد" } as const;
    if (!window.confirm(`تأكيد ${labels[action]} الجرد؟`)) return;
    setSaving(true);
    try {
      const r = await api(`/api/physical-inventory/${countId}/${action}`, {
        method: "POST",
      });
      if (!r.ok) {
        setError(r.error ?? `فشل ${labels[action]} الجرد`);
        return;
      }
      setNotice(
        action === "approve" && r.adjusted !== null
          ? `تم اعتماد الجرد وتسوية ${r.adjusted} صنف`
          : `تم ${labels[action]} الجرد`,
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const variances = initialItems.filter((i) => (i.variance ?? 0) !== 0).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>الأصناف</CardTitle>
          </CardHeader>
          <CardContent>{initialItems.length}</CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>المحسوبة</CardTitle>
          </CardHeader>
          <CardContent>
            {initialItems.filter((i) => i.countedQuantity !== null).length}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>فروقات</CardTitle>
          </CardHeader>
          <CardContent>{variances}</CardContent>
        </Card>
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
      <DataTable<CountItem>
        data={initialItems}
        rowKey={(r) => r.id}
        emptyTitle="لا توجد أصناف"
        columns={[
          {
            header: "الصنف",
            cell: (r) => (r.productName ? `${r.productName} (${r.productCode})` : "—"),
          },
          { header: "النظام", cell: (r) => r.systemQuantity },
          {
            header: "المحسوب",
            cell: (r) =>
              editable ? (
                <Input
                  dir="ltr"
                  inputMode="numeric"
                  className="h-7 w-24"
                  aria-label={`الكمية المحسوبة لـ ${r.productName ?? r.id}`}
                  value={drafts[r.id] ?? ""}
                  onChange={(e) => setDraft(r.id, e.target.value)}
                />
              ) : (
                (r.countedQuantity ?? "—")
              ),
          },
          {
            header: "الفرق",
            cell: (r) =>
              r.variance === null || r.variance === undefined ? (
                "—"
              ) : r.variance === 0 ? (
                <Badge variant="secondary">مطابق</Badge>
              ) : (
                <Badge variant="destructive" dir="ltr">
                  {r.variance > 0 ? `+${r.variance}` : r.variance}
                </Badge>
              ),
          },
        ]}
      />
      {editable && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={saveCounts} disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ الكميات"}
          </Button>
          {(status === "draft" || status === "counting") && (
            <Button
              variant="outline"
              onClick={() => runAction("complete")}
              disabled={saving}
            >
              إكمال الجرد
            </Button>
          )}
          {status === "completed" && (
            <Button
              variant="outline"
              onClick={() => runAction("approve")}
              disabled={saving}
            >
              اعتماد وتسوية الفروقات
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
