"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface MovementRow {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  warehouseId: string;
  warehouseName: string | null;
  quantity: number;
  type: string;
  reason: string | null;
  userName: string | null;
  createdAt: string;
}

export interface MovementWarehouse {
  id: string;
  name: string;
}

const ALL = "__all__";

const TYPE_LABELS: Record<string, string> = {
  IN: "وارد",
  OUT: "صادر",
  SALE: "بيع",
  TRANSFER: "نقل",
  ADJUST: "تسوية",
};

export function MovementsManager({
  initialMovements,
  warehouses,
}: {
  initialMovements: MovementRow[];
  warehouses: MovementWarehouse[];
}) {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState(ALL);
  const [warehouseFilter, setWarehouseFilter] = React.useState(ALL);

  const filtered = initialMovements.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (m.productName ?? "").toLowerCase().includes(q) ||
      (m.productCode ?? "").toLowerCase().includes(q);
    const matchesType = typeFilter === ALL || m.type === typeFilter;
    const matchesWarehouse = warehouseFilter === ALL || m.warehouseId === warehouseFilter;
    return matchesSearch && matchesType && matchesWarehouse;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          className="max-w-xs flex-1"
          placeholder="بحث باسم الصنف أو رمزه..."
          value={search}
          onValueChange={setSearch}
        />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? ALL)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="كل الأنواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الأنواع</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={warehouseFilter}
          onValueChange={(v) => setWarehouseFilter(v ?? ALL)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل المخازن" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل المخازن</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable<MovementRow>
        data={filtered}
        rowKey={(r) => r.id}
        emptyTitle="لا توجد حركات"
        emptyDescription="لم تُسجّل أي حركة مخزون بعد"
        columns={[
          {
            header: "التاريخ",
            cell: (r) => new Date(r.createdAt).toLocaleString("ar"),
          },
          {
            header: "الصنف",
            cell: (r) => (r.productName ? `${r.productName} (${r.productCode})` : "—"),
          },
          { header: "المخزن", cell: (r) => r.warehouseName ?? "—" },
          {
            header: "النوع",
            cell: (r) => <Badge variant="outline">{TYPE_LABELS[r.type] ?? r.type}</Badge>,
          },
          {
            header: "الكمية",
            cell: (r) => (
              <span dir="ltr" className={r.quantity < 0 ? "text-destructive" : ""}>
                {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
              </span>
            ),
          },
          { header: "السبب", cell: (r) => r.reason ?? "—" },
          { header: "المستخدم", cell: (r) => r.userName ?? "—" },
        ]}
      />
    </div>
  );
}
