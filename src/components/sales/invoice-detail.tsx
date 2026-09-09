"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface InvoiceItem {
  id: string;
  productName: string;
  productCode: string;
  quantity: number;
  returnedQuantity: number;
  unitPrice: number;
  total: number;
  isService: boolean;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  paymentType: string;
  notes: string | null;
  createdAt: string;
}

export interface InvoiceReturn {
  id: string;
  reason: string;
  total: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  completed: "مكتملة",
  returned: "مرتجعة",
  cancelled: "ملغاة",
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقدي",
  credit: "آجل",
  bank: "بنكي",
  wallet: "محفظة",
  check: "شيك",
};

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return { ok: res.ok, error: data?.error ?? null };
}

export function InvoiceDetail({
  sale,
  canReturn,
  canCancel,
}: {
  sale: {
    id: string;
    invoiceNumber: number;
    customerName: string | null;
    userName: string | null;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentType: string;
    paymentStatus: string;
    notes: string | null;
    status: string;
    createdAt: string;
    items: InvoiceItem[];
    payments: InvoicePayment[];
    returns: InvoiceReturn[];
  };
  canReturn: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [returnOpen, setReturnOpen] = React.useState(false);
  const [returnQtys, setReturnQtys] = React.useState<Record<string, string>>({});
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const returnable = sale.status !== "cancelled" && sale.status !== "returned";

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const items = Object.entries(returnQtys)
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
      const r = await api(`/api/sales/${sale.id}/return`, {
        method: "POST",
        body: JSON.stringify({ items, reason }),
      });
      if (!r.ok) {
        setError(r.error ?? "فشل معالجة المرتجع");
        return;
      }
      setReturnOpen(false);
      setNotice("تمت معالجة المرتجع بنجاح");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const onCancel = async () => {
    setError(null);
    setNotice(null);
    if (!window.confirm(`إلغاء الفاتورة #${sale.invoiceNumber}؟ سيُستعاد المخزون.`))
      return;
    const r = await api(`/api/sales/${sale.id}`, { method: "DELETE" });
    if (!r.ok) {
      setError(r.error ?? "فشل إلغاء الفاتورة");
      return;
    }
    setNotice("تم إلغاء الفاتورة");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p
          role="status"
          className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm print:hidden"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm print:hidden"
        >
          {error}
        </p>
      )}
      <div data-slot="invoice-print" className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              فاتورة <span dir="ltr">#{sale.invoiceNumber}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">العميل</p>
              <p className="font-medium">{sale.customerName ?? "نقدي"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">البائع</p>
              <p className="font-medium">{sale.userName ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">الدفع</p>
              <p className="font-medium">
                {PAYMENT_LABELS[sale.paymentType] ?? sale.paymentType} —{" "}
                {sale.paymentStatus}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">الحالة</p>
              <Badge variant={sale.status === "cancelled" ? "destructive" : "outline"}>
                {STATUS_LABELS[sale.status] ?? sale.status}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">التاريخ</p>
              <p className="font-medium">
                {new Date(sale.createdAt).toLocaleString("ar")}
              </p>
            </div>
            {sale.notes && (
              <div className="col-span-2">
                <p className="text-muted-foreground">ملاحظات</p>
                <p className="font-medium">{sale.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <DataTable<InvoiceItem>
          data={sale.items}
          rowKey={(r) => r.id}
          emptyTitle="لا توجد أصناف"
          columns={[
            { header: "الصنف", cell: (r) => `${r.productName} (${r.productCode})` },
            { header: "الكمية", cell: (r) => <span dir="ltr">{r.quantity}</span> },
            {
              header: "المرتجع",
              cell: (r) => <span dir="ltr">{r.returnedQuantity}</span>,
            },
            {
              header: "السعر",
              cell: (r) => <span dir="ltr">{r.unitPrice.toFixed(2)}</span>,
            },
            {
              header: "الإجمالي",
              cell: (r) => <span dir="ltr">{r.total.toFixed(2)}</span>,
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card size="sm">
            <CardHeader>
              <CardTitle>المدفوعات</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              {sale.payments.length === 0 ? (
                <p className="text-muted-foreground">لا توجد مدفوعات مسجلة</p>
              ) : (
                sale.payments.map((p) => (
                  <div key={p.id} className="flex justify-between">
                    <span>{PAYMENT_LABELS[p.paymentType] ?? p.paymentType}</span>
                    <span dir="ltr">{p.amount.toFixed(2)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>المرتجعات</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              {sale.returns.length === 0 ? (
                <p className="text-muted-foreground">لا توجد مرتجعات</p>
              ) : (
                sale.returns.map((r) => (
                  <div key={r.id} className="flex justify-between gap-2">
                    <span className="truncate">{r.reason}</span>
                    <span dir="ltr">{r.total.toFixed(2)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card size="sm">
          <CardContent className="flex flex-col gap-1 py-4 text-sm">
            <div className="flex justify-between">
              <span>المجموع الفرعي</span>
              <span dir="ltr">{sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>الخصم</span>
              <span dir="ltr">{sale.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>الإجمالي</span>
              <span dir="ltr">{sale.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          طباعة الفاتورة
        </Button>
        {canReturn && returnable && (
          <Button variant="outline" onClick={() => setReturnOpen(true)}>
            مرتجع
          </Button>
        )}
        {canCancel && sale.status === "completed" && (
          <Button variant="outline" onClick={onCancel}>
            إلغاء الفاتورة
          </Button>
        )}
      </div>

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مرتجع مبيعات</DialogTitle>
            <DialogDescription>
              حدد الكميات المرتجعة لكل صنف مع ذكر السبب
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitReturn} className="flex flex-col gap-3">
            {sale.items
              .filter((i) => i.quantity - i.returnedQuantity > 0)
              .map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="flex-1 truncate text-sm">
                    {item.productName} (المتاح: {item.quantity - item.returnedQuantity})
                  </span>
                  <Input
                    dir="ltr"
                    inputMode="numeric"
                    className="h-8 w-24"
                    aria-label={`مرتجع ${item.productName}`}
                    placeholder="0"
                    value={returnQtys[item.id] ?? ""}
                    onChange={(e) =>
                      setReturnQtys((q) => ({ ...q, [item.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="return-reason">سبب المرتجع *</Label>
              <Input
                id="return-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "جارٍ المعالجة..." : "معالجة المرتجع"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
