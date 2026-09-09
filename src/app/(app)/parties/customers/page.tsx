import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listCustomersFull } from "@/server/services/party.service";
import { PartyManager } from "@/components/parties/party-manager";
import { PageError } from "@/components/shared/page-error";

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "customers:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">العملاء</h1>
          <p className="text-muted-foreground mt-1 text-sm">إدارة العملاء وأرصدتهم</p>
        </div>
        <PageError title="صلاحية غير كافية" description="تحتاج إلى صلاحية عرض العملاء." />
      </div>
    );
  }
  const rows = await listCustomersFull();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">العملاء</h1>
        <p className="text-muted-foreground mt-1 text-sm">إدارة العملاء وأرصدتهم</p>
      </div>
      <PartyManager
        kind="customers"
        title="العملاء"
        single="عميل"
        initialRows={rows}
        canCreate={hasPermission(user.permissions, "customers:create")}
        canUpdate={hasPermission(user.permissions, "customers:update")}
        canDelete={hasPermission(user.permissions, "customers:delete")}
      />
    </div>
  );
}
