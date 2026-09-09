import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listReportProducts } from "@/server/services/report.service";
import { PriceHistory } from "@/components/reports/price-history";
import { PageError } from "@/components/shared/page-error";

export default async function PriceHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "reports:view")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">سجل الأسعار</h1>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض التقارير."
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">سجل الأسعار</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          أسعار البيع والشراء عبر الزمن لكل صنف
        </p>
      </div>
      <PriceHistory initialProducts={await listReportProducts()} />
    </div>
  );
}
