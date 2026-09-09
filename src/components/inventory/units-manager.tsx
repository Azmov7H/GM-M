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

export interface UnitRow {
  id: string;
  name: string;
  nameShort: string;
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return { ok: res.ok, error: data?.error ?? null };
}

export function UnitsManager({
  initialUnits,
  canManage,
}: {
  initialUnits: UnitRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<
    { mode: "create" } | { mode: "edit"; row: UnitRow } | null
  >(null);
  const [saving, setSaving] = React.useState(false);

  const submitValues = async (values: { name: string; nameShort: string }) => {
    if (!dialog) return;
    setError(null);
    setSaving(true);
    try {
      const r =
        dialog.mode === "create"
          ? await api("/api/units", { method: "POST", body: JSON.stringify(values) })
          : await api(`/api/units/${dialog.row.id}`, {
              method: "PUT",
              body: JSON.stringify(values),
            });
      if (!r.ok) {
        setError(r.error ?? "فشل الحفظ");
        return;
      }
      setDialog(null);
      setNotice(dialog.mode === "create" ? "تم إنشاء الوحدة" : "تم حفظ التعديلات");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: UnitRow) => {
    setError(null);
    setNotice(null);
    if (!window.confirm(`حذف الوحدة "${row.name}"؟`)) return;
    const r = await api(`/api/units/${row.id}`, { method: "DELETE" });
    if (!r.ok) {
      setError(r.error ?? "فشل حذف الوحدة");
      return;
    }
    setNotice("تم حذف الوحدة");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-start">
          <Button onClick={() => setDialog({ mode: "create" })}>وحدة جديدة</Button>
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
      <DataTable<UnitRow>
        data={initialUnits}
        rowKey={(r) => r.id}
        emptyTitle="لا توجد وحدات"
        columns={[
          { header: "الاسم", cell: (r) => r.name },
          { header: "المختصر", cell: (r) => r.nameShort },
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
              {dialog?.mode === "edit" ? "تعديل الوحدة" : "وحدة جديدة"}
            </DialogTitle>
            <DialogDescription>أدخل اسم الوحدة ومختصرها</DialogDescription>
          </DialogHeader>
          {dialog && (
            <UnitForm
              key={dialog.mode === "edit" ? dialog.row.id : "new"}
              initialName={dialog.mode === "edit" ? dialog.row.name : ""}
              initialShort={dialog.mode === "edit" ? dialog.row.nameShort : ""}
              saving={saving}
              onSubmit={submitValues}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UnitForm({
  initialName,
  initialShort,
  saving,
  onSubmit,
}: {
  initialName: string;
  initialShort: string;
  saving: boolean;
  onSubmit: (values: { name: string; nameShort: string }) => void;
}) {
  const [name, setName] = React.useState(initialName);
  const [nameShort, setNameShort] = React.useState(initialShort);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, nameShort });
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="unit-name">الاسم</Label>
        <Input
          id="unit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="unit-short">المختصر</Label>
        <Input
          id="unit-short"
          value={nameShort}
          onChange={(e) => setNameShort(e.target.value)}
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
