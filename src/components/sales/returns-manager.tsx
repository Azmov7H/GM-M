"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import type { InvoiceItem } from "@/components/sales/invoice-detail";

interface ReturnableSale {
  id: string;
  invoiceNumber: number;
  customerName: string | null;
  total: number;
  createdAt: string;
}

interface SaleDetail {
  id: string;
  invoiceNumber: number;
  items: InvoiceItem[];
}

export function ReturnsManager({ initialSales }: { initialSales: ReturnableSale[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [saleId, setSaleId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<SaleDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [qtys, setQtys] = React.useState<Record<string, string>>({});
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = initialSales.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      String(s.invoiceNumber).includes(q) ||
      (s.customerName ?? "").toLowerCase().includes(q)
    );
  });

  async function selectSale(id: string) {
    setSaleId(id);
    setDetail(null);
    setQtys({});
    setReason("");
    setNotice(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}`);
      const body = (await res.json()) as { sale?: SaleDetail; error?: string };
      if (!res.ok || !body.sale) {
        setError(body.error ?? "تعذر تحميل الفاتورة");
        return;
      }
      setDetail(body.sale);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!saleId) return;
    setError(null);
    setNotice(null);
    const items = Object.entries(qtys)
      .filter(([, v]) => v.trim() !== "" && Number(v) > 0)
      .map(([saleItemId, v]) => ({ saleItemId, quantity: Math.floor(Number(v)) }));
    if (items.length === 0) {
      setError("حدد كمية مرتجع واحدة على الأقل");
      return;
    }
    if (!reason.trim()) {
      setError("سبب المرتجع مطلوب");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, reason }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "فشل معالجة المرتجع");
        return;
      }
      setNotice("تمت معالجة المرتجع بنجاح");
      setDetail(null);
      setSaleId(null);
      setQtys({});
      setReason("");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>الفواتير القابلة للإرجاع</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="بحث برقم الفاتورة أو العميل..."
            aria-label="بحث عن فاتورة"
          />
          <DataTable<ReturnableSale>
            data={filtered.slice(0, 50)}
            rowKey={(r) => r.id}
            emptyTitle="لا توجد فواتير مكتملة"
            columns={[
              {
                header: "الرقم",
                cell: (r) => <span dir="ltr">#{r.invoiceNumber}</span>,
              },
              { header: "العميل", cell: (r) => r.customerName ?? "نقدي" },
              {
                header: "الإجمالي",
                cell: (r) => <span dir="ltr">{r.total.toFixed(2)}</span>,
              },
              {
                header: "",
                cell: (r) => (
                  <Button
                    size="sm"
                    variant={r.id === saleId ? "default" : "outline"}
                    onClick={() => selectSale(r.id)}
                  >
                    اختيار
                  </Button>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {detail ? (
              <>
                مرتجع فاتورة <span dir="ltr">#{detail.invoiceNumber}</span>
              </>
            ) : (
              "تفاصيل المرتجع"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-muted-foreground text-sm">جارٍ التحميل...</p>}
          {!loading && !detail && (
            <p className="text-muted-foreground text-sm">
              اختر فاتورة من القائمة لبدء المرتجع.
            </p>
          )}
          {detail && (
            <form onSubmit={submit} className="flex flex-col gap-3">
              {detail.items.map((item) => {
                const max = item.quantity - item.returnedQuantity;
                if (max <= 0) return null;
                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.productName} ({item.productCode})
                      </p>
                      <p className="text-muted-foreground text-xs">
                        المباع: <span dir="ltr">{item.quantity}</span> — المرتجع سابقاً:{" "}
                        <span dir="ltr">{item.returnedQuantity}</span>
                      </p>
                    </div>
                    <div className="flex w-28 flex-col gap-1">
                      <Label htmlFor={`ret-${item.id}`}>الكمية (بحد أقصى {max})</Label>
                      <Input
                        id={`ret-${item.id}`}
                        inputMode="numeric"
                        value={qtys[item.id] ?? ""}
                        onChange={(e) =>
                          setQtys((q) => ({ ...q, [item.id]: e.target.value }))
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="return-reason">سبب المرتجع</Label>
                <Input
                  id="return-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: عيب مصنعي"
                />
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
                <Button type="submit" disabled={saving}>
                  {saving ? "جارٍ المعالجة..." : "تأكيد المرتجع"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
