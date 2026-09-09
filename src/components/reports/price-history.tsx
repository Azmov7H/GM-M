"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadCsv } from "./csv";

interface ProductOption {
  id: string;
  code: string;
  name: string;
}

interface PricePoint {
  date: string;
  kind: "sale" | "purchase";
  price: number;
  quantity: number;
  reference: string;
}

export function PriceHistory({ initialProducts }: { initialProducts: ProductOption[] }) {
  const [products] = React.useState<ProductOption[]>(initialProducts);
  const [productId, setProductId] = React.useState("");
  const [points, setPoints] = React.useState<PricePoint[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = async (id: string) => {
    setProductId(id);
    if (!id) {
      setPoints([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/reports/price-history?productId=${encodeURIComponent(id)}`,
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "فشل التحميل");
        return;
      }
      setPoints(data.points ?? []);
    } catch {
      setError("تعذر الاتصال بالخادم");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={productId} onValueChange={(v) => load(v ?? "")}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="اختر صنفاً" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.code} {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          disabled={points.length === 0}
          onClick={() =>
            downloadCsv(
              "price-history.csv",
              ["التاريخ", "النوع", "السعر", "الكمية", "المرجع"],
              points.map((p) => [
                p.date.slice(0, 10),
                p.kind === "sale" ? "بيع" : "شراء",
                p.price,
                p.quantity,
                p.reference,
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
        <DataTable<PricePoint>
          data={points}
          rowKey={(r) => `${r.date}:${r.kind}:${r.reference}:${r.price}`}
          emptyTitle={
            productId ? "لا حركات سعرية لهذا الصنف" : "اختر صنفاً لعرض سجل أسعاره"
          }
          columns={[
            { header: "التاريخ", cell: (r) => new Date(r.date).toLocaleDateString("ar") },
            {
              header: "النوع",
              cell: (r) =>
                r.kind === "sale" ? (
                  <Badge variant="secondary">بيع</Badge>
                ) : (
                  <Badge variant="default">شراء</Badge>
                ),
            },
            { header: "السعر", cell: (r) => <span dir="ltr">{r.price.toFixed(2)}</span> },
            { header: "الكمية", cell: (r) => r.quantity },
            { header: "المرجع", cell: (r) => r.reference },
          ]}
        />
      )}
    </div>
  );
}
