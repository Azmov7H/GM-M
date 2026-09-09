"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DateFilter } from "./date-filter";
import { downloadCsv } from "./csv";

interface PaymentRow {
  id: string;
  entityType: string;
  amount: number;
  paymentType: string;
  notes: string | null;
  createdAt: string;
}

const ENTITY_LABELS: Record<string, string> = { customer: "تحصيل", supplier: "سداد" };

export interface FinancialSummary {
  revenue: number;
  costs: number;
  gross: number;
  collections: number;
  settlements: number;
  receivableTotal: number;
  payableTotal: number;
}

export function FinancialReport({
  initialSummary,
  initialPayments,
}: {
  initialSummary: FinancialSummary;
  initialPayments: PaymentRow[];
}) {
  const [summary, setSummary] = React.useState<FinancialSummary>(initialSummary);
  const [payments, setPayments] = React.useState<PaymentRow[]>(initialPayments);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const res = await fetch(`/api/reports/financial?${q.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "فشل تحميل التقرير");
        return;
      }
      const r = data.report;
      setSummary({
        revenue: r.revenue ?? 0,
        costs: r.costs ?? 0,
        gross: r.gross ?? 0,
        collections: r.collections ?? 0,
        settlements: r.settlements ?? 0,
        receivableTotal: r.receivableTotal ?? 0,
        payableTotal: r.payableTotal ?? 0,
      });
      setPayments(r.payments ?? []);
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
            <CardTitle>إيراد المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{summary.revenue.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>تكلفة المشتريات</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{summary.costs.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>الإجمالي (تقريبي)</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{summary.gross.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>تحصيل / سداد</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{summary.collections.toFixed(2)}</span> /{" "}
            <span dir="ltr">{summary.settlements.toFixed(2)}</span>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DateFilter initialFrom="" initialTo="" onApply={load} />
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              "financial-report.csv",
              ["النوع", "المبلغ", "التاريخ"],
              payments.map((p) => [
                ENTITY_LABELS[p.entityType] ?? p.entityType,
                p.amount,
                p.createdAt.slice(0, 10),
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
        <DataTable<PaymentRow>
          data={payments}
          rowKey={(r) => r.id}
          emptyTitle="لا حركات مالية في الفترة"
          columns={[
            { header: "النوع", cell: (r) => ENTITY_LABELS[r.entityType] ?? r.entityType },
            {
              header: "المبلغ",
              cell: (r) => <span dir="ltr">{r.amount.toFixed(2)}</span>,
            },
            { header: "ملاحظات", cell: (r) => r.notes ?? "—" },
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
