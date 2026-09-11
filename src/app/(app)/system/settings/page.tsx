import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listBackups } from "@/server/services/backup.service";
import { getSettings } from "@/server/services/settings.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { BackupManager } from "@/components/system/backup-manager";
import { CompanySettingsForm } from "@/components/system/company-settings-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const canCreateBackup = hasPermission(user.permissions, "backup:create");
  const canRestoreBackup = hasPermission(user.permissions, "backup:restore");
  const backups = canCreateBackup ? listBackups() : [];
  const canManageSettings = hasPermission(user.permissions, "users:update");
  const companySettings = canManageSettings ? await getSettings() : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground mt-1 text-sm">إعدادات الحساب والنظام</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>تغيير كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
      {(canCreateBackup || canRestoreBackup) && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>النسخ الاحتياطي</CardTitle>
          </CardHeader>
          <CardContent>
            <BackupManager
              initialBackups={backups}
              canCreate={canCreateBackup}
              canRestore={canRestoreBackup}
            />
          </CardContent>
        </Card>
      )}
      {companySettings && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>الشركة والفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanySettingsForm initial={companySettings} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
