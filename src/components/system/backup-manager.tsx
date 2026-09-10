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

export interface BackupRow {
  filename: string;
  size: number;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function BackupManager({
  initialBackups,
  canCreate,
  canRestore,
}: {
  initialBackups: BackupRow[];
  canCreate: boolean;
  canRestore: boolean;
}) {
  const router = useRouter();
  const [backups, setBackups] = React.useState(initialBackups);
  const [creating, setCreating] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const [restoreTarget, setRestoreTarget] = React.useState<BackupRow | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/backup/list");
    if (res.ok) {
      const data = (await res.json()) as { backups: BackupRow[] };
      setBackups(data.backups);
    }
  }

  async function handleCreate() {
    setCreating(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/backup/create", { method: "POST" });
      const data = (await res.json().catch(() => null)) as {
        backup?: BackupRow;
        error?: string;
      } | null;
      if (!res.ok) {
        setError(data?.error ?? "فشل إنشاء النسخة الاحتياطية");
        return;
      }
      setNotice(`تم إنشاء النسخة ${data?.backup?.filename ?? ""}`);
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  async function handleRestore() {
    if (!restoreTarget) return;
    setRestoring(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: restoreTarget.filename, confirm: true }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        safetyCopy?: string;
      } | null;
      if (!res.ok) {
        setError(data?.error ?? "فشلت الاستعادة");
        return;
      }
      setRestoreTarget(null);
      setNotice("تمت الاستعادة — سيتم تحويلك لتسجيل الدخول");
      setTimeout(() => router.push("/login"), 2000);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {canCreate && (
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "جارٍ إنشاء النسخة…" : "إنشاء نسخة احتياطية"}
          </Button>
        )}
        <span className="text-muted-foreground text-xs">
          الاستعادة تستبدل البيانات الحالية بعد حفظ نسخة أمان تلقائياً
        </span>
      </div>
      <DataTable<BackupRow>
        data={backups}
        rowKey={(r) => r.filename}
        emptyTitle="لا توجد نسخ احتياطية"
        columns={[
          {
            header: "الملف",
            cell: (r) => (
              <span dir="ltr" className="font-mono text-xs">
                {r.filename}
              </span>
            ),
          },
          { header: "الحجم", cell: (r) => <span dir="ltr">{formatSize(r.size)}</span> },
          {
            header: "التاريخ",
            cell: (r) => (
              <span dir="ltr">{new Date(r.createdAt).toLocaleString("en-GB")}</span>
            ),
          },
          {
            header: "النوع",
            cell: (r) => (
              <Badge
                variant={r.filename.startsWith("pre-restore") ? "outline" : "secondary"}
              >
                {r.filename.startsWith("pre-restore") ? "نسخة أمان" : "نسخة يدوية"}
              </Badge>
            ),
          },
          {
            header: "إجراءات",
            cell: (r) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-sm underline-offset-4 hover:underline"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = `/api/backup/${encodeURIComponent(r.filename)}`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }}
                >
                  تنزيل
                </button>
                {canRestore && (
                  <button
                    type="button"
                    className="text-destructive text-sm underline-offset-4 hover:underline"
                    onClick={() => {
                      setError(null);
                      setRestoreTarget(r);
                    }}
                  >
                    استعادة
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />
      <Dialog
        open={restoreTarget !== null}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الاستعادة</DialogTitle>
            <DialogDescription>
              سيتم استبدال قاعدة البيانات الحالية بالنسخة{" "}
              <span dir="ltr" className="font-mono">
                {restoreTarget?.filename}
              </span>
              . هذا الإجراء لا يمكن التراجع عنه، وسيتم تسجيل خروجك بعد الاستعادة.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRestoreTarget(null)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleRestore} disabled={restoring}>
              {restoring ? "جارٍ الاستعادة…" : "تأكيد الاستعادة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
