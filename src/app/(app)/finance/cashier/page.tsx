import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getCashierSummary } from "@/server/services/cashier.service";
import { getSetting } from "@/server/services/settings.service";
import { PageHeader } from "@/components/shared/page-header";
import { PageError } from "@/components/shared/page-error";
import { CashierSummary } from "@/components/finance/cashier-summary";

export default async function CashierPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "financial:read")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="الخزينة" description="ملخص الإغلاق اليومي للصندوق" />
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية العرض المالي."
        />
      </div>
    );
  }
  const summary = await getCashierSummary();
  const currency = await getSetting("company.currency");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الخزينة" description="ملخص الإغلاق اليومي للصندوق" />
      <CashierSummary summary={summary} currency={currency} />
    </div>
  );
}
