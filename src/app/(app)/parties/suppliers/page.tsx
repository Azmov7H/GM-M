import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listSuppliersFull } from "@/server/services/party.service";
import { PartyManager } from "@/components/parties/party-manager";
import { PageError } from "@/components/shared/page-error";

export default async function SuppliersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "suppliers:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الموردين</h1>
          <p className="text-muted-foreground mt-1 text-sm">إدارة الموردين وأرصدتهم</p>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض الموردين."
        />
      </div>
    );
  }
  const rows = await listSuppliersFull();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الموردين</h1>
        <p className="text-muted-foreground mt-1 text-sm">إدارة الموردين وأرصدتهم</p>
      </div>
      <PartyManager
        kind="suppliers"
        title="الموردين"
        single="مورد"
        initialRows={rows}
        canCreate={hasPermission(user.permissions, "suppliers:create")}
        canUpdate={hasPermission(user.permissions, "suppliers:update")}
        canDelete={hasPermission(user.permissions, "suppliers:delete")}
      />
    </div>
  );
}
