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

interface UserRow {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

interface RoleRow {
  id: string;
  name: string;
}

interface UsersManagerProps {
  initialUsers: UserRow[];
  roles: RoleRow[];
  canCreate: boolean;
  canUpdate: boolean;
  currentUserId: string;
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    tempPassword?: string;
  } | null;
  return {
    ok: res.ok,
    error: data?.error ?? null,
    tempPassword: data?.tempPassword ?? null,
  };
}

export function UsersManager({
  initialUsers,
  roles,
  canCreate,
  canUpdate,
  currentUserId,
}: UsersManagerProps) {
  const router = useRouter();
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<UserRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  const refresh = () => router.refresh();

  const onCreated = () => {
    setCreateOpen(false);
    setNotice("تم إنشاء المستخدم بنجاح");
    refresh();
  };

  const onUpdated = () => {
    setEditUser(null);
    setNotice("تم حفظ التعديلات بنجاح");
    refresh();
  };

  const onDeactivate = async (row: UserRow) => {
    setError(null);
    setNotice(null);
    const action = row.isActive ? "تعطيل" : "تفعيل";
    if (!window.confirm(`تأكيد ${action} المستخدم "${row.displayName}"؟`)) return;
    if (row.isActive) {
      const r = await api(`/api/users/${row.id}`, { method: "DELETE" });
      if (!r.ok) {
        setError(r.error ?? `فشل ${action} المستخدم`);
        return;
      }
    } else {
      const r = await api(`/api/users/${row.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: true }),
      });
      if (!r.ok) {
        setError(r.error ?? `فشل ${action} المستخدم`);
        return;
      }
    }
    setNotice(`تم ${action} المستخدم بنجاح`);
    refresh();
  };

  const onResetPassword = async (row: UserRow) => {
    setError(null);
    setNotice(null);
    if (!window.confirm(`إعادة تعيين كلمة المرور للمستخدم "${row.displayName}"؟`)) return;
    const r = await api(`/api/users/${row.id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!r.ok) {
      setError(r.error ?? "فشل إعادة تعيين كلمة المرور");
      return;
    }
    setNotice(
      r.tempPassword
        ? `كلمة المرور المؤقتة: ${r.tempPassword} — شاركها مع المستخدم واطلب منه تغييرها`
        : "تمت إعادة تعيين كلمة المرور",
    );
    refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {canCreate && (
        <div className="flex justify-start">
          <Button onClick={() => setCreateOpen(true)}>مستخدم جديد</Button>
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
      <DataTable<UserRow>
        data={initialUsers}
        rowKey={(r) => r.id}
        emptyTitle="لا يوجد مستخدمون"
        emptyDescription="أنشئ أول مستخدم من زر مستخدم جديد"
        columns={[
          { header: "الاسم", cell: (r) => r.displayName },
          { header: "اسم المستخدم", cell: (r) => <span dir="ltr">{r.username}</span> },
          {
            header: "الحالة",
            cell: (r) =>
              r.isActive ? (
                <Badge variant="secondary">نشط</Badge>
              ) : (
                <Badge variant="outline">معطّل</Badge>
              ),
          },
          {
            header: "إجراءات",
            align: "end",
            cell: (r) =>
              canUpdate ? (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditUser(r)}>
                    تعديل
                  </Button>
                  {r.id !== currentUserId && (
                    <Button variant="ghost" size="sm" onClick={() => onDeactivate(r)}>
                      {r.isActive ? "تعطيل" : "تفعيل"}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onResetPassword(r)}>
                    تعيين كلمة المرور
                  </Button>
                </div>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              ),
          },
        ]}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مستخدم جديد</DialogTitle>
            <DialogDescription>أنشئ حساب مستخدم جديد وأسند له الأدوار</DialogDescription>
          </DialogHeader>
          <CreateUserForm
            roles={roles}
            saving={saving}
            setSaving={setSaving}
            onDone={onCreated}
            onError={setError}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>حدّث بيانات المستخدم وأدواره</DialogDescription>
          </DialogHeader>
          {editUser && (
            <EditUserForm
              user={editUser}
              roles={roles}
              saving={saving}
              setSaving={setSaving}
              onDone={onUpdated}
              onError={setError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoleCheckboxes({
  roles,
  selected,
  onChange,
}: {
  roles: RoleRow[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <span className="text-sm font-medium">الأدوار</span>
      {roles.map((role) => (
        <label key={role.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={selected.includes(role.id)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...selected, role.id]
                  : selected.filter((id) => id !== role.id),
              )
            }
          />
          {role.name}
        </label>
      ))}
    </div>
  );
}

function CreateUserForm({
  roles,
  saving,
  setSaving,
  onDone,
  onError,
}: {
  roles: RoleRow[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  onDone: () => void;
  onError: (msg: string | null) => void;
}) {
  const [username, setUsername] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [roleIds, setRoleIds] = React.useState<string[]>([]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError(null);
    setSaving(true);
    try {
      const r = await api("/api/users", {
        method: "POST",
        body: JSON.stringify({ username, displayName, email, password, roleIds }),
      });
      if (!r.ok) {
        onError(r.error ?? "فشل إنشاء المستخدم");
        return;
      }
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-username">اسم المستخدم</Label>
        <Input
          id="new-username"
          dir="ltr"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-display">الاسم المعروض</Label>
        <Input
          id="new-display"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-email">البريد (اختياري)</Label>
        <Input
          id="new-email"
          dir="ltr"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password">كلمة المرور</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <RoleCheckboxes roles={roles} selected={roleIds} onChange={setRoleIds} />
      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "إنشاء"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditUserForm({
  user,
  roles,
  saving,
  setSaving,
  onDone,
  onError,
}: {
  user: UserRow;
  roles: RoleRow[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  onDone: () => void;
  onError: (msg: string | null) => void;
}) {
  const [displayName, setDisplayName] = React.useState(user.displayName);
  const [email, setEmail] = React.useState(user.email ?? "");
  const [roleIds, setRoleIds] = React.useState<string[]>([]);
  const [loadedRoles, setLoadedRoles] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: { roles?: string[] } } | null) => {
        if (cancelled || !data?.user) return;
        const names: string[] = data.user.roles ?? [];
        setRoleIds(roles.filter((r) => names.includes(r.name)).map((r) => r.id));
        setLoadedRoles(true);
      })
      .catch(() => {
        if (!cancelled) setLoadedRoles(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id, roles]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError(null);
    setSaving(true);
    try {
      const r = await api(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ displayName, email, roleIds }),
      });
      if (!r.ok) {
        onError(r.error ?? "فشل حفظ التعديلات");
        return;
      }
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-display">الاسم المعروض</Label>
        <Input
          id="edit-display"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-email">البريد</Label>
        <Input
          id="edit-email"
          dir="ltr"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {loadedRoles ? (
        <RoleCheckboxes roles={roles} selected={roleIds} onChange={setRoleIds} />
      ) : (
        <p className="text-muted-foreground text-sm">جارٍ تحميل الأدوار...</p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </DialogFooter>
    </form>
  );
}
