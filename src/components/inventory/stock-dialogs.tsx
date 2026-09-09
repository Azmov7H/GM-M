"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StockProductOption, StockWarehouseOption } from "./stock-manager";

export function TransferDialog({
  products,
  warehouses,
  initialProductId,
  initialFromWarehouseId,
  saving,
  serverError,
  onSubmit,
}: {
  products: StockProductOption[];
  warehouses: StockWarehouseOption[];
  initialProductId?: string;
  initialFromWarehouseId?: string;
  saving: boolean;
  serverError: string | null;
  onSubmit: (values: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: string;
    notes: string;
  }) => void;
}) {
  const [productId, setProductId] = React.useState(initialProductId ?? "");
  const [fromWarehouseId, setFromWarehouseId] = React.useState(
    initialFromWarehouseId ?? "",
  );
  const [toWarehouseId, setToWarehouseId] = React.useState("");
  const [quantity, setQuantity] = React.useState("1");
  const [notes, setNotes] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setFormError("اختر المنتج");
      return;
    }
    if (!fromWarehouseId || !toWarehouseId) {
      setFormError("اختر مخزن المصدر والوجهة");
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      setFormError("مخزن المصدر والوجهة يجب أن يكونا مختلفين");
      return;
    }
    setFormError(null);
    onSubmit({ productId, fromWarehouseId, toWarehouseId, quantity, notes });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>المنتج</Label>
        <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر المنتج" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} ({p.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>من مخزن</Label>
          <Select
            value={fromWarehouseId}
            onValueChange={(v) => setFromWarehouseId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="المصدر" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>إلى مخزن</Label>
          <Select value={toWarehouseId} onValueChange={(v) => setToWarehouseId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="الوجهة" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="transfer-qty">الكمية</Label>
        <Input
          id="transfer-qty"
          dir="ltr"
          inputMode="numeric"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="transfer-notes">ملاحظات (اختياري)</Label>
        <Input
          id="transfer-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {(formError || serverError) && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
        >
          {formError ?? serverError}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? "جارٍ التنفيذ..." : "تنفيذ النقل"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AdjustDialog({
  products,
  warehouses,
  initialProductId,
  initialWarehouseId,
  initialQuantity,
  saving,
  serverError,
  onSubmit,
}: {
  products: StockProductOption[];
  warehouses: StockWarehouseOption[];
  initialProductId?: string;
  initialWarehouseId?: string;
  initialQuantity?: number;
  saving: boolean;
  serverError: string | null;
  onSubmit: (values: {
    productId: string;
    warehouseId: string;
    quantity: string;
    reason: string;
  }) => void;
}) {
  const [productId, setProductId] = React.useState(initialProductId ?? "");
  const [warehouseId, setWarehouseId] = React.useState(initialWarehouseId ?? "");
  const [quantity, setQuantity] = React.useState(
    initialQuantity !== undefined ? String(initialQuantity) : "0",
  );
  const [reason, setReason] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setFormError("اختر المنتج");
      return;
    }
    if (!warehouseId) {
      setFormError("اختر المخزن");
      return;
    }
    if (!reason.trim()) {
      setFormError("سبب التسوية مطلوب");
      return;
    }
    setFormError(null);
    onSubmit({ productId, warehouseId, quantity, reason });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>المنتج</Label>
        <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر المنتج" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} ({p.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>المخزن</Label>
          <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر المخزن" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="adjust-qty">الكمية الفعلية</Label>
          <Input
            id="adjust-qty"
            dir="ltr"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="adjust-reason">سبب التسوية *</Label>
        <Input
          id="adjust-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>
      {(formError || serverError) && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
        >
          {formError ?? serverError}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ التسوية"}
        </Button>
      </DialogFooter>
    </form>
  );
}
