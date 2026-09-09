"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";

export interface PartyRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export type PartyKind = "customers" | "suppliers";

function api(path: string, init?: RequestInit) {
  return fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  }).then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => null) }));
}

export function PartyManager({
  kind,
  title,
  single,
  initialRows,
  canCreate,
  canUpdate,
  canDelete,
}: {
  kind: PartyKind;
  title: string;
  single: string;
  initialRows: PartyRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PartyRow | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = initialRows.filter((r) => {
    const q = search.trim().toLowerCase();
    return (
      !q || r.name.toLowerCase().includes(q) || (r.phone ?? "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setError(null);
    setFormOpen(true);
  };
  const openEdit = (row: PartyRow) => {
    setEditing(row);
    setName(row.name);
    setPhone(row.phone ?? "");
    setEmail(row.email ?? "");
    setAddress(row.address ?? "");
    setError(null);
    setFormOpen(true);
  };

  const onSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError("الاسم مطلوب");
    setSaving(true);
    try {
      const body = JSON.stringify({
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
      });
      const res = editing
        ? await api(`/api/${kind}/${editing.id}`, { method: "PUT", body })
        : await api(`/api/${kind}`, { method: "POST", body });
      if (!res.ok) {
        setError(res.data?.error ?? "فشلت العملية");
        setSaving(false);
        return;
      }
      setFormOpen(false);
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    }
    setSaving(false);
  };

  const onDelete = async (row: PartyRow) => {
    if (!confirm(`إيقاف ${single} "${row.name}"؟`)) return;
    setError(null);
    const res = await api(`/api/${kind}/${row.id}`, { method: "DELETE" });
    if (!res.ok) setError(res.data?.error ?? "فشل الإيقاف");
    else router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>إجمالي الأرصدة المستحقة</CardTitle>
        </CardHeader>
        <CardContent>
          <span dir="ltr">
            {initialRows.reduce((s, r) => s + (r.balance ?? 0), 0).toFixed(2)}
          </span>{" "}
          ({initialRows.filter((r) => (r.balance ?? 0) > 0.009).length} {single})
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          className="max-w-xs flex-1"
          value={search}
          onValueChange={setSearch}
          placeholder={`بحث بالاسم أو الهاتف...`}
        />
        {canCreate && <Button onClick={openCreate}>{single} جديد</Button>}
      </div>
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}
      <DataTable<PartyRow>
        data={filtered}
        rowKey={(r) => r.id}
        emptyTitle={`لا يوجد ${title}`}
        emptyDescription={canCreate ? `أنشئ أول ${single} من الزر أعلاه` : undefined}
        columns={[
          {
            header: "الاسم",
            cell: (r) => (
              <Link
                className="font-medium underline-offset-4 hover:underline"
                href={`/${kind === "customers" ? "parties/customers" : "parties/suppliers"}/${r.id}`}
              >
                {r.name}
              </Link>
            ),
          },
          { header: "الهاتف", cell: (r) => <span dir="ltr">{r.phone ?? "—"}</span> },
          {
            header: "الرصيد",
            cell: (r) =>
              (r.balance ?? 0) > 0.009 ? (
                <Badge variant="default">
                  <span dir="ltr">{(r.balance ?? 0).toFixed(2)}</span>
                </Badge>
              ) : (
                <span dir="ltr">0.00</span>
              ),
          },
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
                  <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                    تعديل
                  </Button>
                )}
                {canDelete && r.isActive && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(r)}>
                    إيقاف
                  </Button>
                )}
                {!canUpdate && !(canDelete && r.isActive) && (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </div>
            ),
          },
        ]}
      />
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `تعديل ${single}` : `${single} جديد`}</DialogTitle>
            <DialogDescription>أدخل بيانات {single}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label>الاسم</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label>الهاتف</Label>
                <Input
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>البريد</Label>
                <Input
                  dir="ltr"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>العنوان</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="العنوان"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={onSubmit} disabled={saving}>
                {saving ? "جاري..." : editing ? "حفظ" : "إنشاء"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
