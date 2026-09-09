"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";

export interface RecentSaleRow {
  id: string;
  invoiceNumber: number;
  customerName: string | null;
  total: number;
}

export interface LowStockRow {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
}

export function RecentSalesTable({ rows }: { rows: RecentSaleRow[] }) {
  return (
    <DataTable<RecentSaleRow>
      data={rows}
      rowKey={(r) => r.id}
      emptyTitle="لا مبيعات بعد"
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
        { header: "الإجمالي", cell: (r) => <span dir="ltr">{r.total.toFixed(2)}</span> },
      ]}
    />
  );
}

export function LowStockTable({ rows }: { rows: LowStockRow[] }) {
  return (
    <DataTable<LowStockRow>
      data={rows}
      rowKey={(r) => `${r.productId}:${r.warehouseId}`}
      emptyTitle="لا نواقص"
      columns={[
        { header: "الصنف", cell: (r) => r.productName },
        { header: "المخزن", cell: (r) => r.warehouseName },
        { header: "الرصيد", cell: (r) => <Badge variant="default">{r.quantity}</Badge> },
      ]}
    />
  );
}
