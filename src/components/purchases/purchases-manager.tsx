"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { PurchaseListItem } from "@/server/services/purchase.service";

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  submitted: "مقدم",
  received: "مستلم",
  cancelled: "ملغي",
};
const ALL = "__all__";

function api(path: string, init?: RequestInit) {
  return fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  }).then(async (r) => ({
    ok: r.ok,
    status: r.status,
    data: await r.json().catch(() => null),
  }));
}

function Money({ value }: { value: number }) {
  return <span dir="ltr">{value.toFixed(2)}</span>;
}

export function PurchasesManager({
  initialPurchases,
  stats,
}: {
  initialPurchases: PurchaseListItem[];
  stats: {
    todayTotal: number;
    todayCount: number;
    totalValue: number;
    totalCount: number;
  };
}) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState(ALL);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [receiving, setReceiving] = React.useState<PurchaseListItem | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const [supplierId, setSupplierId] = React.useState("");
  const [tax, setTax] = React.useState("0");
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState<
    { productId: string; quantity: string; unitCost: string }[]
  >([]);

  const [products, setProducts] = React.useState<
    { id: string; code: string; name: string; buyPrice: number }[]
  >([]);
  const [suppliers, setSuppliers] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
    ])
      .then(([prods, supps]) => {
        setProducts(prods.products ?? []);
        setSuppliers(supps.suppliers ?? []);
      })
      .catch(() => {});
  }, []);

  const filtered = initialPurchases.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      String(p.orderNumber).includes(q) ||
      (p.supplierName ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === ALL || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const addItem = () =>
    setItems((prev) => [...prev, { productId: "", quantity: "1", unitCost: "0" }]);
  const updateItem = (idx: number, field: string, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        setItems((prev) =>
          prev.map((it, i) =>
            i === idx ? { ...it, unitCost: String(product.buyPrice) } : it,
          ),
        );
      }
    }
  };
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const onCreate = async () => {
    setError(null);
    if (!supplierId) return setError("المورد مطلوب");
    const valid = items.filter(
      (i) =>
        i.productId &&
        Number.isFinite(Number(i.quantity)) &&
        Number(i.quantity) > 0 &&
        Number.isFinite(Number(i.unitCost)),
    );
    if (valid.length === 0) return setError("أضف صنفاً واحداً على الأقل");
    setSubmitting(true);
    try {
      const res = await api("/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          supplierId,
          tax: Number(tax) || 0,
          notes: notes || null,
          items: valid.map((i) => ({
            productId: i.productId,
            quantity: Number(i.quantity),
            unitCost: Number(i.unitCost),
          })),
        }),
      });
      if (!res.ok) {
        setError(res.data?.error ?? "فشل الإنشاء");
        setSubmitting(false);
        return;
      }
      setCreateOpen(false);
      setSupplierId("");
      setTax("0");
      setNotes("");
      setItems([]);
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    }
    setSubmitting(false);
  };

  const onReceive = async (qtyMap: Record<string, number>) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api(`/api/purchases/${receiving?.id}/receive`, {
        method: "POST",
        body: JSON.stringify({
          items: Object.entries(qtyMap).map(([itemId, qty]) => ({
            itemId,
            quantity: qty,
          })),
        }),
      });
      if (!res.ok) {
        setError(res.data?.error ?? "فشل الاستلام");
        setSubmitting(false);
        return;
      }
      setReceiving(null);
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    }
    setSubmitting(false);
  };

  const onCancel = async (id: string) => {
    if (!confirm("إلغاء أمر الشراء؟")) return;
    setSubmitting(true);
    const res = await api(`/api/purchases/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setError(res.data?.error ?? "فشل الإلغاء");
    setSubmitting(false);
  };

  const columns = [
    {
      header: "الرقم",
      cell: (r: PurchaseListItem) => <span dir="ltr">#{r.orderNumber}</span>,
    },
    { header: "المورد", cell: (r: PurchaseListItem) => r.supplierName ?? "—" },
    { header: "الإجمالي", cell: (r: PurchaseListItem) => <Money value={r.total} /> },
    {
      header: "الحالة",
      cell: (r: PurchaseListItem) => {
        const v =
          r.status === "received"
            ? "secondary"
            : r.status === "cancelled"
              ? "outline"
              : "default";
        return <Badge variant={v}>{STATUS_LABELS[r.status] ?? r.status}</Badge>;
      },
    },
    {
      header: "التاريخ",
      cell: (r: PurchaseListItem) => new Date(r.createdAt).toLocaleDateString("ar"),
    },
    {
      header: "إجراءات",
      align: "end" as const,
      cell: (r: PurchaseListItem) => (
        <div className="flex justify-end gap-1">
          {r.status === "submitted" && (
            <Button variant="ghost" size="sm" onClick={() => setReceiving(r)}>
              استلام
            </Button>
          )}
          {r.status !== "cancelled" && r.status !== "received" && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(r.id)}>
              إلغاء
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>مشتريات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{stats.todayTotal.toFixed(2)}</span> ({stats.todayCount})
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>إجمالي المشتريات</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{stats.totalValue.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>عدد الأوامر</CardTitle>
          </CardHeader>
          <CardContent>{stats.totalCount}</CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          className="max-w-xs flex-1"
          value={search}
          onValueChange={setSearch}
          placeholder="بحث برقم الامر أو المورد..."
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? ALL)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setCreateOpen(true);
            setError(null);
          }}
        >
          أمر شراء جديد
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}
      <DataTable<PurchaseListItem>
        data={filtered}
        rowKey={(r) => r.id}
        emptyTitle="لا أوامر شراء"
        emptyDescription="أنشئ أول أمر شراء"
        columns={columns}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>أمر شراء جديد</DialogTitle>
            <DialogDescription>اختر المورد والأصناف والتكاليف</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label>المورد</Label>
              <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مورداً" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {items.map((it, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Label>الصنف</Label>
                  <Select
                    value={it.productId}
                    onValueChange={(v) => updateItem(idx, "productId", v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="صنف" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code} {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-20 flex-col gap-1">
                  <Label>كمية</Label>
                  <Input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  />
                </div>
                <div className="flex w-24 flex-col gap-1">
                  <Label>تكلفة</Label>
                  <Input
                    dir="ltr"
                    type="number"
                    min={0}
                    step={0.01}
                    value={it.unitCost}
                    onChange={(e) => updateItem(idx, "unitCost", e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeItem(idx)}>
                  حذف
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addItem}>
                + صنف
              </Button>
              <Input
                placeholder="ملاحظات"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="ضريبة"
                type="number"
                min={0}
                step={0.01}
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="w-24"
                dir="ltr"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  setError(null);
                }}
              >
                إلغاء
              </Button>
              <Button onClick={onCreate} disabled={submitting}>
                {submitting ? "جاري..." : "إنشاء"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {receiving && (
        <ReceiveDialog
          purchase={receiving}
          onClose={() => setReceiving(null)}
          onSubmit={onReceive}
          submitting={submitting}
        />
      )}
    </div>
  );
}

function ReceiveDialog({
  purchase,
  onClose,
  onSubmit,
  submitting,
}: {
  purchase: PurchaseListItem;
  onClose: () => void;
  onSubmit: (qtyMap: Record<string, number>) => void;
  submitting: boolean;
}) {
  const [qties, setQties] = React.useState<Record<string, string>>({});
  const [detailItems, setDetailItems] = React.useState<
    {
      id: string;
      productName: string;
      productCode: string;
      quantity: number;
      receivedQuantity: number;
      unitCost: number;
    }[]
  >([]);
  React.useEffect(() => {
    if (purchase)
      fetch(`/api/purchases/${purchase.id}`)
        .then((r) => r.json())
        .then((d) => setDetailItems(d.purchase?.items ?? []))
        .catch(() => {});
  }, [purchase]);
  return (
    <Dialog
      open={!!purchase}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>استلام امر الشراء #{purchase.orderNumber}</DialogTitle>
          <DialogDescription>{purchase.supplierName}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {detailItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <span>
                {item.productCode} {item.productName}
              </span>
              <span className="text-muted-foreground text-xs">
                المستلم: {item.receivedQuantity}/{item.quantity}
              </span>
              <Input
                dir="ltr"
                type="number"
                min={0}
                max={item.quantity - item.receivedQuantity}
                value={qties[item.id] ?? ""}
                onChange={(e) => setQties((p) => ({ ...p, [item.id]: e.target.value }))}
                className="w-28"
                placeholder="كمية الاستلام"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            onClick={() => {
              const map: Record<string, number> = {};
              for (const [k, v] of Object.entries(qties)) {
                const n = Number(v);
                if (n > 0) map[k] = n;
              }
              onSubmit(map);
            }}
            disabled={
              submitting || Object.values(qties).every((v) => !v || Number(v) <= 0)
            }
          >
            {submitting ? "جاري..." : "تأكيد الاستلام"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
