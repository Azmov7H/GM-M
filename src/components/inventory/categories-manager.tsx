"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CategoryRow {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return { ok: res.ok, error: data?.error ?? null };
}

export function CategoriesManager({
  initialCategories,
  canManage,
}: {
  initialCategories: CategoryRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<
    { mode: "create" } | { mode: "edit"; row: CategoryRow } | null
  >(null);
  const [saving, setSaving] = React.useState(false);

  const submitName = async (name: string) => {
    if (!dialog) return;
    setError(null);
    setSaving(true);
    try {
      const r =
        dialog.mode === "create"
          ? await api("/api/categories", {
              method: "POST",
              body: JSON.stringify({ name }),
            })
          : await api(`/api/categories/${dialog.row.id}`, {
              method: "PUT",
              body: JSON.stringify({ name }),
            });
      if (!r.ok) {
        setError(r.error ?? "فشل الحفظ");
        return;
      }
      setDialog(null);
      setNotice(dialog.mode === "create" ? "تم إنشاء الفئة" : "تم حفظ التعديلات");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: CategoryRow) => {
    setError(null);
    setNotice(null);
    if (!window.confirm(`حذف الفئة "${row.name}"؟`)) return;
    const r = await api(`/api/categories/${row.id}`, { method: "DELETE" });
    if (!r.ok) {
      setError(r.error ?? "فشل حذف الفئة");
      return;
    }
    setNotice("تم حذف الفئة");
    router.refresh();
  };

  const parentName = (id: string | null) =>
    initialCategories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-start">
          <Button onClick={() => setDialog({ mode: "create" })}>فئة جديدة</Button>
        </div>
      )}
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
      <DataTable<CategoryRow>
        data={initialCategories}
        rowKey={(r) => r.id}
        emptyTitle="لا توجد فئات"
        columns={[
          { header: "الاسم", cell: (r) => r.name },
          { header: "الفئة الأب", cell: (r) => parentName(r.parentId) },
          {
            header: "إجراءات",
            align: "end",
            cell: (r) =>
              canManage ? (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialog({ mode: "edit", row: r })}
                  >
                    تعديل
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(r)}>
                    حذف
                  </Button>
                </div>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              ),
          },
        ]}
      />
      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "edit" ? "تعديل الفئة" : "فئة جديدة"}
            </DialogTitle>
            <DialogDescription>أدخل اسم الفئة</DialogDescription>
          </DialogHeader>
          {dialog && (
            <CategoryForm
              key={dialog.mode === "edit" ? dialog.row.id : "new"}
              initialName={dialog.mode === "edit" ? dialog.row.name : ""}
              saving={saving}
              onSubmit={submitName}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryForm({
  initialName,
  saving,
  onSubmit,
}: {
  initialName: string;
  saving: boolean;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = React.useState(initialName);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(name);
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-name">الاسم</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </DialogFooter>
    </form>
  );
}
