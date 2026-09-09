"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdjustDialog, TransferDialog } from "./stock-dialogs";

export interface StockLevelRow {
  productId: string;
  productCode: string;
  productName: string;
  minLevel: number;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  isLow: boolean;
}

export interface StockProductOption {
  id: string;
  name: string;
  code: string;
}

export interface StockWarehouseOption {
  id: string;
  name: string;
}

const ALL_WAREHOUSES = "__all__";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return { ok: res.ok, error: data?.error ?? null };
}

export function StockManager({
  initialLevels,
  products,
  warehouses,
  canTransfer,
  canAdjust,
}: {
  initialLevels: StockLevelRow[];
  products: StockProductOption[];
  warehouses: StockWarehouseOption[];
  canTransfer: boolean;
  canAdjust: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [warehouseFilter, setWarehouseFilter] = React.useState(ALL_WAREHOUSES);
  const [lowOnly, setLowOnly] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [transferPreset, setTransferPreset] = React.useState<{
    productId?: string;
    fromWarehouseId?: string;
  } | null>(null);
  const [adjustPreset, setAdjustPreset] = React.useState<{
    productId?: string;
    warehouseId?: string;
    quantity?: number;
  } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const filtered = initialLevels.filter((l) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      l.productName.toLowerCase().includes(q) ||
      l.productCode.toLowerCase().includes(q);
    const matchesWarehouse =
      warehouseFilter === ALL_WAREHOUSES || l.warehouseId === warehouseFilter;
    const matchesLow = !lowOnly || l.isLow;
    return matchesSearch && matchesWarehouse && matchesLow;
  });

  const onTransfer = async (v: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: string;
    notes: string;
  }) => {
    setError(null);
    setSaving(true);
    try {
      const r = await api("/api/stock/transfer", {
        method: "POST",
        body: JSON.stringify({
          productId: v.productId,
          fromWarehouseId: v.fromWarehouseId,
          toWarehouseId: v.toWarehouseId,
          quantity: Math.floor(Number(v.quantity)),
          notes: v.notes || null,
        }),
      });
      if (!r.ok) {
        setError(r.error ?? "فشل تنفيذ النقل");
        return;
      }
      setTransferPreset(null);
      setNotice("تم تنفيذ النقل بنجاح");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const onAdjust = async (v: {
    productId: string;
    warehouseId: string;
    quantity: string;
    reason: string;
  }) => {
    setError(null);
    setSaving(true);
    try {
      const r = await api("/api/stock/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: v.productId,
          warehouseId: v.warehouseId,
          quantity: Math.floor(Number(v.quantity)),
          reason: v.reason,
        }),
      });
      if (!r.ok) {
        setError(r.error ?? "فشل حفظ التسوية");
        return;
      }
      setAdjustPreset(null);
      setNotice("تم حفظ التسوية بنجاح");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          className="max-w-xs flex-1"
          placeholder="بحث بالاسم أو الرمز..."
          value={search}
          onValueChange={setSearch}
        />
        <Select
          value={warehouseFilter}
          onValueChange={(v) => setWarehouseFilter(v ?? ALL_WAREHOUSES)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل المخازن" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_WAREHOUSES}>كل المخازن</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
          />
          النواقص فقط
        </label>
        <div className="ms-auto flex gap-2">
          {canTransfer && (
            <Button variant="outline" onClick={() => setTransferPreset({})}>
              نقل مخزون
            </Button>
          )}
          {canAdjust && (
            <Button variant="outline" onClick={() => setAdjustPreset({})}>
              تسوية
            </Button>
          )}
          <Link
            href="/inventory/counts"
            className={buttonVariants({ variant: "outline" })}
          >
            الجرد الفعلي
          </Link>
        </div>
      </div>
      {notice && (
        <p
          role="status"
          className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}
      <DataTable<StockLevelRow>
        data={filtered}
        rowKey={(r) => `${r.productId}:${r.warehouseId}`}
        emptyTitle="لا يوجد مخزون"
        emptyDescription="لا توجد أرصدة مطابقة للبحث الحالي"
        columns={[
          { header: "المنتج", cell: (r) => `${r.productName} (${r.productCode})` },
          { header: "المخزن", cell: (r) => r.warehouseName },
          { header: "الكمية", cell: (r) => r.quantity },
          { header: "الحد الأدنى", cell: (r) => r.minLevel },
          {
            header: "الحالة",
            cell: (r) =>
              r.isLow ? (
                <Badge variant="destructive">ناقص</Badge>
              ) : (
                <Badge variant="secondary">متوفر</Badge>
              ),
          },
          {
            header: "إجراءات",
            align: "end",
            cell: (r) => (
              <div className="flex justify-end gap-1">
                {canTransfer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setTransferPreset({
                        productId: r.productId,
                        fromWarehouseId: r.warehouseId,
                      })
                    }
                  >
                    نقل
                  </Button>
                )}
                {canAdjust && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAdjustPreset({
                        productId: r.productId,
                        warehouseId: r.warehouseId,
                        quantity: r.quantity,
                      })
                    }
                  >
                    تسوية
                  </Button>
                )}
                {!canTransfer && !canAdjust && (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </div>
            ),
          },
        ]}
      />
      <Dialog
        open={transferPreset !== null}
        onOpenChange={(open) => !open && setTransferPreset(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نقل مخزون</DialogTitle>
            <DialogDescription>انقل كمية من مخزن إلى آخر (عملية ذرية)</DialogDescription>
          </DialogHeader>
          {transferPreset && (
            <TransferDialog
              products={products}
              warehouses={warehouses}
              initialProductId={transferPreset.productId}
              initialFromWarehouseId={transferPreset.fromWarehouseId}
              saving={saving}
              serverError={error}
              onSubmit={onTransfer}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={adjustPreset !== null}
        onOpenChange={(open) => !open && setAdjustPreset(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسوية مخزون</DialogTitle>
            <DialogDescription>
              اضبط الرصيد على الكمية الفعلية مع ذكر السبب
            </DialogDescription>
          </DialogHeader>
          {adjustPreset && (
            <AdjustDialog
              products={products}
              warehouses={warehouses}
              initialProductId={adjustPreset.productId}
              initialWarehouseId={adjustPreset.warehouseId}
              initialQuantity={adjustPreset.quantity}
              saving={saving}
              serverError={error}
              onSubmit={onAdjust}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
