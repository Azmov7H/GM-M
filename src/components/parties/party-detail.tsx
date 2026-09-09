"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { PartyKind } from "./party-manager";

export interface TxnRow {
  id: string;
  invoiceNumber?: number;
  orderNumber?: number;
  total: number;
  paymentStatus?: string;
  status: string;
  createdAt: string;
}

export interface PaymentRow {
  id: string;
  amount: number;
  paymentType: string;
  notes: string | null;
  createdAt: string;
}

export interface PartyDetailData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
  transactions: TxnRow[];
  payments: PaymentRow[];
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقدي",
  bank: "بنكي",
  wallet: "محفظة",
  check: "شيك",
};

function api(path: string, init?: RequestInit) {
  return fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  }).then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => null) }));
}

export function PartyDetail({
  kind,
  txnTitle,
  txnEmpty,
  data,
  canRecordPayment,
}: {
  kind: PartyKind;
  txnTitle: string;
  txnEmpty: string;
  data: PartyDetailData;
  canRecordPayment: boolean;
}) {
  const router = useRouter();
  const [payOpen, setPayOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [paymentType, setPaymentType] = React.useState("cash");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onPay = async () => {
    setError(null);
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return setError("المبلغ يجب أن يكون أكبر من صفر");
    setSaving(true);
    try {
      const res = await api(`/api/${kind}/${data.id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount: n, paymentType, notes: notes || null }),
      });
      if (!res.ok) {
        setError(res.data?.error ?? "فشل تسجيل الدفعة");
        setSaving(false);
        return;
      }
      setPayOpen(false);
      setAmount("");
      setNotes("");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    }
    setSaving(false);
  };

  const txnLink = (t: TxnRow) =>
    kind === "customers" ? `/sales/invoices/${t.id}` : `/inventory/purchase-orders`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>الرصيد المستحق</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{(data.balance ?? 0).toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{txnTitle}</CardTitle>
          </CardHeader>
          <CardContent>{data.transactions.length}</CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>الدفعات</CardTitle>
          </CardHeader>
          <CardContent>{data.payments.length}</CardContent>
        </Card>
      </div>
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {canRecordPayment && (data.balance ?? 0) > 0.009 && (
          <Button
            onClick={() => {
              setPayOpen(true);
              setError(null);
            }}
          >
            {kind === "customers" ? "تحصيل دفعة" : "سداد دفعة"}
          </Button>
        )}
        <Link
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          href={kind === "customers" ? "/parties/customers" : "/parties/suppliers"}
        >
          عودة للقائمة
        </Link>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">البيانات</TabsTrigger>
          <TabsTrigger value="txns">{txnTitle}</TabsTrigger>
          <TabsTrigger value="payments">الدفعات</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card size="sm">
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">الاسم</dt>
                  <dd className="font-medium">{data.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">الهاتف</dt>
                  <dd dir="ltr" className="text-end">
                    {data.phone ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">البريد</dt>
                  <dd dir="ltr" className="text-end">
                    {data.email ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">العنوان</dt>
                  <dd>{data.address ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">الحالة</dt>
                  <dd>
                    {data.isActive ? (
                      <Badge variant="secondary">نشط</Badge>
                    ) : (
                      <Badge variant="outline">موقوف</Badge>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="txns">
          <DataTable<TxnRow>
            data={data.transactions}
            rowKey={(r) => r.id}
            emptyTitle={txnEmpty}
            columns={[
              {
                header: "الرقم",
                cell: (r) => (
                  <Link className="underline-offset-4 hover:underline" href={txnLink(r)}>
                    <span dir="ltr">#{r.invoiceNumber ?? r.orderNumber}</span>
                  </Link>
                ),
              },
              {
                header: "الإجمالي",
                cell: (r) => <span dir="ltr">{r.total.toFixed(2)}</span>,
              },
              {
                header: "الحالة",
                cell: (r) => (
                  <Badge variant={r.status === "cancelled" ? "outline" : "secondary"}>
                    {r.status}
                  </Badge>
                ),
              },
              {
                header: "التاريخ",
                cell: (r) => new Date(r.createdAt).toLocaleDateString("ar"),
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="payments">
          <DataTable<PaymentRow>
            data={data.payments}
            rowKey={(r) => r.id}
            emptyTitle="لا دفعات مسجلة"
            columns={[
              {
                header: "المبلغ",
                cell: (r) => <span dir="ltr">{r.amount.toFixed(2)}</span>,
              },
              {
                header: "الطريقة",
                cell: (r) => PAYMENT_LABELS[r.paymentType] ?? r.paymentType,
              },
              { header: "ملاحظات", cell: (r) => r.notes ?? "—" },
              {
                header: "التاريخ",
                cell: (r) => new Date(r.createdAt).toLocaleDateString("ar"),
              },
            ]}
          />
        </TabsContent>
      </Tabs>
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {kind === "customers"
                ? `تحصيل من ${data.name}`
                : `سداد للمورد ${data.name}`}
            </DialogTitle>
            <DialogDescription>
              الرصيد المستحق: <span dir="ltr">{(data.balance ?? 0).toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label>المبلغ</Label>
              <Input
                dir="ltr"
                type="number"
                min={0.01}
                step={0.01}
                max={data.balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>طريقة الدفع</Label>
              <Select
                value={paymentType}
                onValueChange={(v) => setPaymentType(v ?? "cash")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>ملاحظات</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="اختياري"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={onPay} disabled={saving}>
                {saving ? "جاري..." : "تأكيد"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
