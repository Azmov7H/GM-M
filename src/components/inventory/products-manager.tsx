"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ProductForm, type ProductFormValues } from "./product-form";

export interface ProductRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unitId: string | null;
  unitName: string | null;
  buyPrice: number;
  retailPrice: number;
  wholesalePrice: number | null;
  minLevel: number | null;
  isActive: boolean;
}

export interface CatalogOption {
  id: string;
  name: string;
}

const ALL_CATEGORIES = "__all__";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return { ok: res.ok, error: data?.error ?? null };
}

export function ProductsManager({
  initialProducts,
  categories,
  units,
  canCreate,
  canUpdate,
  canDelete,
}: {
  initialProducts: ProductRow[];
  categories: CatalogOption[];
  units: CatalogOption[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState(ALL_CATEGORIES);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<ProductRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  const filtered = initialProducts.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    const matchesCategory =
      categoryFilter === ALL_CATEGORIES || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const toPayload = (v: ProductFormValues) => ({
    code: v.code.trim() || undefined,
    name: v.name.trim(),
    description: v.description.trim() || null,
    categoryId: v.categoryId || null,
    unitId: v.unitId || null,
    buyPrice: Number(v.buyPrice) || 0,
    retailPrice: Number(v.retailPrice) || 0,
    wholesalePrice: v.wholesalePrice.trim() ? Number(v.wholesalePrice) : null,
    minLevel: v.minLevel.trim() ? Math.max(0, Math.floor(Number(v.minLevel))) : 5,
  });

  const onCreate = async (v: ProductFormValues) => {
    setError(null);
    setSaving(true);
    try {
      const r = await api("/api/products", {
        method: "POST",
        body: JSON.stringify(toPayload(v)),
      });
      if (!r.ok) {
        setError(r.error ?? "فشل إنشاء المنتج");
        return;
      }
      setCreateOpen(false);
      setNotice("تم إنشاء المنتج بنجاح");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const onUpdate = async (v: ProductFormValues) => {
    if (!editProduct) return;
    setError(null);
    setSaving(true);
    try {
      const r = await api(`/api/products/${editProduct.id}`, {
        method: "PUT",
        body: JSON.stringify(toPayload(v)),
      });
      if (!r.ok) {
        setError(r.error ?? "فشل حفظ التعديلات");
        return;
      }
      setEditProduct(null);
      setNotice("تم حفظ التعديلات بنجاح");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: ProductRow) => {
    setError(null);
    setNotice(null);
    if (!window.confirm(`حذف المنتج "${row.name}"؟`)) return;
    const r = await api(`/api/products/${row.id}`, { method: "DELETE" });
    if (!r.ok) {
      setError(r.error ?? "فشل حذف المنتج");
      return;
    }
    setNotice("تم حذف المنتج بنجاح");
    router.refresh();
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
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v ?? ALL_CATEGORIES)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل الفئات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>كل الفئات</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ms-auto">
          {canCreate && <Button onClick={() => setCreateOpen(true)}>منتج جديد</Button>}
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
      <DataTable<ProductRow>
        data={filtered}
        rowKey={(r) => r.id}
        emptyTitle="لا توجد منتجات"
        emptyDescription="أنشئ أول منتج من زر منتج جديد"
        columns={[
          { header: "الرمز", cell: (r) => <span dir="ltr">{r.code}</span> },
          { header: "الاسم", cell: (r) => r.name },
          { header: "الفئة", cell: (r) => r.categoryName ?? "—" },
          { header: "الوحدة", cell: (r) => r.unitName ?? "—" },
          { header: "الشراء", cell: (r) => r.buyPrice },
          { header: "البيع", cell: (r) => r.retailPrice },
          {
            header: "الحالة",
            cell: (r) =>
              r.isActive ? (
                <Badge variant="secondary">نشط</Badge>
              ) : (
                <Badge variant="outline">موقوف</Badge>
              ),
          },
          {
            header: "إجراءات",
            align: "end",
            cell: (r) => (
              <div className="flex justify-end gap-1">
                {canUpdate && (
                  <Button variant="ghost" size="sm" onClick={() => setEditProduct(r)}>
                    تعديل
                  </Button>
                )}
                {canDelete && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(r)}>
                    حذف
                  </Button>
                )}
                {!canUpdate && !canDelete && (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </div>
            ),
          },
        ]}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>منتج جديد</DialogTitle>
            <DialogDescription>أدخل بيانات المنتج الجديد</DialogDescription>
          </DialogHeader>
          <ProductForm
            categories={categories}
            units={units}
            saving={saving}
            serverError={error}
            submitLabel="إنشاء"
            onSubmit={onCreate}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
            <DialogDescription>حدّث بيانات المنتج</DialogDescription>
          </DialogHeader>
          {editProduct && (
            <ProductForm
              categories={categories}
              units={units}
              initial={{
                code: editProduct.code,
                name: editProduct.name,
                description: editProduct.description,
                categoryId: editProduct.categoryId,
                unitId: editProduct.unitId,
                buyPrice: editProduct.buyPrice,
                retailPrice: editProduct.retailPrice,
                wholesalePrice: editProduct.wholesalePrice,
                minLevel: editProduct.minLevel,
              }}
              saving={saving}
              serverError={error}
              submitLabel="حفظ"
              onSubmit={onUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
