"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { DateFilter } from "./date-filter";
import { downloadCsv } from "./csv";

interface SaleRow {
  id: string;
  invoiceNumber: number;
  customerName: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentType: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقدي",
  credit: "آجل",
  bank: "بنكي",
  wallet: "محفظة",
  check: "شيك",
};

export function SalesReport({
  initialRows,
  initialTotals,
}: {
  initialRows: SaleRow[];
  initialTotals: { totalRevenue: number; totalCount: number; avgInvoice: number };
}) {
  const [rows, setRows] = React.useState<SaleRow[]>(initialRows);
  const [totals, setTotals] = React.useState(initialTotals);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const res = await fetch(`/api/reports/sales?${q.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "فشل تحميل التقرير");
        return;
      }
      setRows(data.report.rows ?? []);
      setTotals({
        totalRevenue: data.report.totalRevenue ?? 0,
        totalCount: data.report.totalCount ?? 0,
        avgInvoice: data.report.avgInvoice ?? 0,
      });
    } catch {
      setError("تعذر الاتصال بالخادم");
    }
    setLoading(false);
  };

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      String(r.invoiceNumber).includes(q) ||
      (r.customerName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>الإيراد</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{totals.totalRevenue.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>عدد الفواتير</CardTitle>
          </CardHeader>
          <CardContent>{totals.totalCount}</CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>متوسط الفاتورة</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{totals.avgInvoice.toFixed(2)}</span>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DateFilter initialFrom="" initialTo="" onApply={load} />
        <SearchInput
          className="max-w-xs flex-1"
          value={search}
          onValueChange={setSearch}
          placeholder="بحث برقم الفاتورة أو العميل..."
        />
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              "sales-report.csv",
              ["رقم الفاتورة", "العميل", "الإجمالي", "الدفع", "الحالة", "التاريخ"],
              filtered.map((r) => [
                r.invoiceNumber,
                r.customerName ?? "",
                r.total,
                PAYMENT_LABELS[r.paymentType] ?? r.paymentType,
                r.status,
                r.createdAt.slice(0, 10),
              ]),
            )
          }
        >
          تصدير CSV
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
      {loading ? (
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      ) : (
        <DataTable<SaleRow>
          data={filtered}
          rowKey={(r) => r.id}
          emptyTitle="لا مبيعات في الفترة"
          columns={[
            {
              header: "الفاتورة",
              cell: (r) => (
                <Link
                  className="underline-offset-4 hover:underline"
                  href={`/sales/invoices/${r.id}`}
                >
                  <span dir="ltr">#{r.invoiceNumber}</span>
                </Link>
              ),
            },
            { header: "العميل", cell: (r) => r.customerName ?? "نقدي" },
            {
              header: "الإجمالي",
              cell: (r) => <span dir="ltr">{r.total.toFixed(2)}</span>,
            },
            {
              header: "الدفع",
              cell: (r) => PAYMENT_LABELS[r.paymentType] ?? r.paymentType,
            },
            {
              header: "التاريخ",
              cell: (r) => new Date(r.createdAt).toLocaleDateString("ar"),
            },
          ]}
        />
      )}
    </div>
  );
}
