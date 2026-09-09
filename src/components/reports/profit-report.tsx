"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DateFilter } from "./date-filter";
import { downloadCsv } from "./csv";

interface ProfitRow {
  customerId: string | null;
  customerName: string;
  invoiceCount: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export function ProfitReport({
  initialRows,
  initialTotals,
}: {
  initialRows: ProfitRow[];
  initialTotals: { revenue: number; cost: number; profit: number };
}) {
  const [rows, setRows] = React.useState<ProfitRow[]>(initialRows);
  const [totals, setTotals] = React.useState(initialTotals);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const res = await fetch(`/api/reports/profit-by-customer?${q.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "فشل تحميل التقرير");
        return;
      }
      setRows(data.report.rows ?? []);
      setTotals(data.report.totals ?? { revenue: 0, cost: 0, profit: 0 });
    } catch {
      setError("تعذر الاتصال بالخادم");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>إجمالي الإيراد</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{totals.revenue.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>إجمالي التكلفة (تقديرية)</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{totals.cost.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>إجمالي الربح (تقديري)</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{totals.profit.toFixed(2)}</span>
          </CardContent>
        </Card>
      </div>
      <p className="text-muted-foreground text-xs">
        التكلفة بسعر الشراء الحالي للأصناف (الأصناف الخدمية بلا تكلفة، والمرتجعات محسوبة
        بالصافي).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <DateFilter initialFrom="" initialTo="" onApply={load} />
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              "profit-by-customer.csv",
              ["العميل", "الفواتير", "الإيراد", "التكلفة", "الربح", "الهامش %"],
              rows.map((r) => [
                r.customerName,
                r.invoiceCount,
                r.revenue.toFixed(2),
                r.cost.toFixed(2),
                r.profit.toFixed(2),
                r.margin.toFixed(1),
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
        <DataTable<ProfitRow>
          data={rows}
          rowKey={(r) => r.customerId ?? "__cash__"}
          emptyTitle="لا بيانات ربحية في الفترة"
          columns={[
            {
              header: "العميل",
              cell: (r) =>
                r.customerId ? (
                  <Link
                    className="font-medium underline-offset-4 hover:underline"
                    href={`/parties/customers/${r.customerId}`}
                  >
                    {r.customerName}
                  </Link>
                ) : (
                  r.customerName
                ),
            },
            { header: "الفواتير", cell: (r) => r.invoiceCount },
            {
              header: "الإيراد",
              cell: (r) => <span dir="ltr">{r.revenue.toFixed(2)}</span>,
            },
            {
              header: "التكلفة",
              cell: (r) => <span dir="ltr">{r.cost.toFixed(2)}</span>,
            },
            {
              header: "الربح",
              cell: (r) => <span dir="ltr">{r.profit.toFixed(2)}</span>,
            },
            {
              header: "الهامش %",
              cell: (r) => <span dir="ltr">{r.margin.toFixed(1)}%</span>,
            },
          ]}
        />
      )}
    </div>
  );
}
