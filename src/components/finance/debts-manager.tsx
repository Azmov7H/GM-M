"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

export interface DebtRow {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
}

export function DebtsManager({
  receivableTotal,
  receivableCount,
  payableTotal,
  payableCount,
  debtors,
  creditors,
}: {
  receivableTotal: number;
  receivableCount: number;
  payableTotal: number;
  payableCount: number;
  debtors: DebtRow[];
  creditors: DebtRow[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>مستحق لنا (عملاء)</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{receivableTotal.toFixed(2)}</span> ({receivableCount})
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>مستحق علينا (موردين)</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{payableTotal.toFixed(2)}</span> ({payableCount})
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>صافي الموقف</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{(receivableTotal - payableTotal).toFixed(2)}</span>
          </CardContent>
        </Card>
      </div>
      <h2 className="text-lg font-semibold">ذمم العملاء</h2>
      <DataTable<DebtRow>
        data={debtors}
        rowKey={(r) => r.id}
        emptyTitle="لا ذمم مستحقة على العملاء"
        columns={[
          {
            header: "العميل",
            cell: (r) => (
              <Link
                className="font-medium underline-offset-4 hover:underline"
                href={`/parties/customers/${r.id}`}
              >
                {r.name}
              </Link>
            ),
          },
          { header: "الهاتف", cell: (r) => <span dir="ltr">{r.phone ?? "—"}</span> },
          {
            header: "المستحق",
            cell: (r) => (
              <Badge variant="default">
                <span dir="ltr">{r.balance.toFixed(2)}</span>
              </Badge>
            ),
          },
        ]}
      />
      <h2 className="text-lg font-semibold">ذمم الموردين</h2>
      <DataTable<DebtRow>
        data={creditors}
        rowKey={(r) => r.id}
        emptyTitle="لا ذمم مستحقة للموردين"
        columns={[
          {
            header: "المورد",
            cell: (r) => (
              <Link
                className="font-medium underline-offset-4 hover:underline"
                href={`/parties/suppliers/${r.id}`}
              >
                {r.name}
              </Link>
            ),
          },
          { header: "الهاتف", cell: (r) => <span dir="ltr">{r.phone ?? "—"}</span> },
          {
            header: "المستحق",
            cell: (r) => (
              <Badge variant="default">
                <span dir="ltr">{r.balance.toFixed(2)}</span>
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
