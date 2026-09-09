import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getProfitByCustomer } from "@/server/services/report.service";
import { ProfitReport } from "@/components/reports/profit-report";
import { PageError } from "@/components/shared/page-error";

export default async function ProfitReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "reports:view")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ربحية العملاء</h1>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض التقارير."
        />
      </div>
    );
  }
  const report = await getProfitByCustomer();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ربحية العملاء</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          الإيراد والتكلفة والربح لكل عميل حسب الفترة
        </p>
      </div>
      <ProfitReport initialRows={report.rows} initialTotals={report.totals} />
    </div>
  );
}
