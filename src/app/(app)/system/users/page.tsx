import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listRoles, listUsers } from "@/server/services/user.service";
import { UsersManager } from "@/components/system/users-manager";
import { PageError } from "@/components/shared/page-error";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.permissions, "users:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المستخدمين</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            إدارة حسابات المستخدمين والأدوار
          </p>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية إدارة المستخدمين للوصول إلى هذه الصفحة."
        />
      </div>
    );
  }

  const [users, roles] = await Promise.all([listUsers(), listRoles()]);
  const canCreate = hasPermission(user.permissions, "users:create");
  const canUpdate = hasPermission(user.permissions, "users:update");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">المستخدمين</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          إدارة حسابات المستخدمين والأدوار
        </p>
      </div>
      <UsersManager
        initialUsers={users}
        roles={roles}
        canCreate={canCreate}
        canUpdate={canUpdate}
        currentUserId={user.id}
      />
    </div>
  );
}
