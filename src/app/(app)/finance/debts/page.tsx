import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getDebtsSummary } from "@/server/services/party.service";
import { DebtsManager } from "@/components/finance/debts-manager";
import { PageError } from "@/components/shared/page-error";

export default async function DebtsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "financial:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الديون</h1>
          <p className="text-muted-foreground mt-1 text-sm">مركز الديون والذمم</p>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية العرض المالي."
        />
      </div>
    );
  }
  const summary = await getDebtsSummary();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الديون</h1>
        <p className="text-muted-foreground mt-1 text-sm">مركز الديون والذمم المستحقة</p>
      </div>
      <DebtsManager {...summary} />
    </div>
  );
}
