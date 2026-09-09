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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CountRow {
  id: string;
  name: string;
  status: string;
  warehouseId: string | null;
  warehouseName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CountWarehouse {
  id: string;
  name: string;
}

const NO_WAREHOUSE = "__all__";

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  counting: "جارٍ الجرد",
  completed: "مكتمل",
  approved: "معتمد",
  cancelled: "ملغي",
};

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    id?: string;
  } | null;
  return { ok: res.ok, error: data?.error ?? null, id: data?.id ?? null };
}

export function CountsManager({
  initialCounts,
  warehouses,
}: {
  initialCounts: CountRow[];
  warehouses: CountWarehouse[];
}) {
  const router = useRouter();
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState(NO_WAREHOUSE);
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const r = await api("/api/physical-inventory", {
        method: "POST",
        body: JSON.stringify({
          name,
          warehouseId: warehouseId === NO_WAREHOUSE ? null : warehouseId,
        }),
      });
      if (!r.ok) {
        setError(r.error ?? "فشل إنشاء الجرد");
        return;
      }
      setCreateOpen(false);
      if (r.id) {
        router.push(`/inventory/counts/${r.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-start">
        <Button onClick={() => setCreateOpen(true)}>جرد جديد</Button>
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
      <DataTable<CountRow>
        data={initialCounts}
        rowKey={(r) => r.id}
        emptyTitle="لا توجد جلسات جرد"
        emptyDescription="أنشئ أول جلسة جرد من زر جرد جديد"
        onRowClick={(r) => router.push(`/inventory/counts/${r.id}`)}
        columns={[
          { header: "الاسم", cell: (r) => r.name },
          { header: "المخزن", cell: (r) => r.warehouseName ?? "كل المخازن" },
          {
            header: "الحالة",
            cell: (r) => (
              <Badge variant="outline">{STATUS_LABELS[r.status] ?? r.status}</Badge>
            ),
          },
          {
            header: "التاريخ",
            cell: (r) => new Date(r.createdAt).toLocaleString("ar"),
          },
        ]}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>جرد جديد</DialogTitle>
            <DialogDescription>
              أنشئ جلسة جرد — يُسمح بجلسة نشطة واحدة فقط
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="count-name">اسم الجرد</Label>
              <Input
                id="count-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>المخزن</Label>
              <Select
                value={warehouseId}
                onValueChange={(v) => setWarehouseId(v ?? NO_WAREHOUSE)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="كل المخازن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_WAREHOUSE}>كل المخازن</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving} onClick={() => setNotice(null)}>
                {saving ? "جارٍ الإنشاء..." : "إنشاء وبدء الجرد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
