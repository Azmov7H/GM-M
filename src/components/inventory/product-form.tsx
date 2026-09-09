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

export interface ProductFormCategory {
  id: string;
  name: string;
}

export interface ProductFormUnit {
  id: string;
  name: string;
}

export interface ProductFormValues {
  code: string;
  name: string;
  description: string;
  categoryId: string;
  unitId: string;
  buyPrice: string;
  retailPrice: string;
  wholesalePrice: string;
  minLevel: string;
}

export interface ProductFormInitial {
  code?: string;
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  unitId?: string | null;
  buyPrice?: number;
  retailPrice?: number;
  wholesalePrice?: number | null;
  minLevel?: number | null;
}

const NO_SELECTION = "__none__";

export function ProductForm({
  categories,
  units,
  initial,
  saving,
  serverError,
  submitLabel,
  onSubmit,
}: {
  categories: ProductFormCategory[];
  units: ProductFormUnit[];
  initial?: ProductFormInitial;
  saving: boolean;
  serverError: string | null;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => void;
}) {
  const [code, setCode] = React.useState(initial?.code ?? "");
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = React.useState(initial?.categoryId ?? NO_SELECTION);
  const [unitId, setUnitId] = React.useState(initial?.unitId ?? NO_SELECTION);
  const [buyPrice, setBuyPrice] = React.useState(
    initial?.buyPrice !== undefined ? String(initial.buyPrice) : "0",
  );
  const [retailPrice, setRetailPrice] = React.useState(
    initial?.retailPrice !== undefined ? String(initial.retailPrice) : "0",
  );
  const [wholesalePrice, setWholesalePrice] = React.useState(
    initial?.wholesalePrice !== undefined && initial.wholesalePrice !== null
      ? String(initial.wholesalePrice)
      : "",
  );
  const [minLevel, setMinLevel] = React.useState(
    initial?.minLevel !== undefined && initial?.minLevel !== null
      ? String(initial.minLevel)
      : "5",
  );
  const [formError, setFormError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("اسم المنتج مطلوب");
      return;
    }
    setFormError(null);
    onSubmit({
      code,
      name,
      description,
      categoryId: categoryId === NO_SELECTION ? "" : categoryId,
      unitId: unitId === NO_SELECTION ? "" : unitId,
      buyPrice,
      retailPrice,
      wholesalePrice,
      minLevel,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-code">الرمز (يُقترح تلقائياً)</Label>
          <Input
            id="product-code"
            dir="ltr"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="P-XXXX"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-name">اسم المنتج *</Label>
          <Input
            id="product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-desc">الوصف</Label>
        <Input
          id="product-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>الفئة</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v ?? NO_SELECTION)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="بدون فئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SELECTION}>بدون فئة</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>الوحدة</Label>
          <Select value={unitId} onValueChange={(v) => setUnitId(v ?? NO_SELECTION)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="بدون وحدة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SELECTION}>بدون وحدة</SelectItem>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-buy">سعر الشراء</Label>
          <Input
            id="product-buy"
            dir="ltr"
            inputMode="decimal"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-retail">سعر البيع</Label>
          <Input
            id="product-retail"
            dir="ltr"
            inputMode="decimal"
            value={retailPrice}
            onChange={(e) => setRetailPrice(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-wholesale">سعر الجملة (اختياري)</Label>
          <Input
            id="product-wholesale"
            dir="ltr"
            inputMode="decimal"
            value={wholesalePrice}
            onChange={(e) => setWholesalePrice(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-min">الحد الأدنى للمخزون</Label>
          <Input
            id="product-min"
            dir="ltr"
            inputMode="numeric"
            value={minLevel}
            onChange={(e) => setMinLevel(e.target.value)}
          />
        </div>
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
          {saving ? "جارٍ الحفظ..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
