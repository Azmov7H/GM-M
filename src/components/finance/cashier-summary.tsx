import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface CashierSummaryData {
  date: string;
  invoiceCount: number;
  cashTotal: number;
  creditTotal: number;
  discountTotal: number;
  collectedTotal: number;
  paidOutTotal: number;
  returnsTotal: number;
  returnsCount: number;
  expectedCash: number;
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between ${strong ? "text-base font-bold" : ""}`}>
      <span>{label}</span>
      <span dir="ltr">{value.toFixed(2)}</span>
    </div>
  );
}

export function CashierSummary({
  summary,
  currency = "ر.س",
}: {
  summary: CashierSummaryData;
  currency?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            مبيعات اليوم <span dir="ltr">({summary.date})</span> —{" "}
            <span dir="ltr">{summary.invoiceCount}</span> فاتورة
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <Row label="مبيعات نقدية" value={summary.cashTotal} />
          <Row label="مبيعات آجلة" value={summary.creditTotal} />
          <Row label="خصومات ممنوحة" value={summary.discountTotal} />
          <Row label={`مرتجعات (${summary.returnsCount})`} value={summary.returnsTotal} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>حركة الصندوق المتوقعة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <Row label="نقدي من المبيعات" value={summary.cashTotal} />
          <Row label="تحصيل من العملاء" value={summary.collectedTotal} />
          <Row label="مدفوع للموردين" value={summary.paidOutTotal} />
          <Row label="مردود نقدي" value={summary.returnsTotal} />
          <Row
            label={`النقد المتوقع في الدرج (${currency})`}
            value={summary.expectedCash}
            strong
          />
        </CardContent>
      </Card>
    </div>
  );
}
