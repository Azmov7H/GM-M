"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { downloadCsv } from "./csv";

interface ShortageRow {
  productId: string;
  productCode: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  minLevel: number;
}

export function ShortageReport({ initialRows }: { initialRows: ShortageRow[] }) {
  const [rows] = React.useState<ShortageRow[]>(initialRows);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">{rows.length} صنف ناقص</Badge>
        <Button
          variant="outline"
          disabled={rows.length === 0}
          onClick={() =>
            downloadCsv(
              "shortage-report.csv",
              ["الرمز", "الصنف", "المخزن", "الرصيد", "الحد الأدنى"],
              rows.map((r) => [
                r.productCode,
                r.productName,
                r.warehouseName,
                r.quantity,
                r.minLevel,
              ]),
            )
          }
        >
          تصدير CSV
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">لا نواقص — المخزون بحالة جيدة</p>
      ) : (
        <DataTable<ShortageRow>
          data={rows}
          rowKey={(r) => `${r.productId}:${r.warehouseId}`}
          emptyTitle="لا نواقص — المخزون بحالة جيدة"
          columns={[
            { header: "الرمز", cell: (r) => <span dir="ltr">{r.productCode}</span> },
            { header: "الصنف", cell: (r) => r.productName },
            { header: "المخزن", cell: (r) => r.warehouseName },
            {
              header: "الرصيد",
              cell: (r) => <Badge variant="default">{r.quantity}</Badge>,
            },
            { header: "الحد الأدنى", cell: (r) => r.minLevel },
          ]}
        />
      )}
    </div>
  );
}
