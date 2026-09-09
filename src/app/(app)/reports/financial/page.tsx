import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getFinancialReport } from "@/server/services/report.service";
import { FinancialReport } from "@/components/reports/financial-report";
import { PageError } from "@/components/shared/page-error";

export default async function FinancialReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "reports:view")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">التقارير المالية</h1>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض التقارير."
        />
      </div>
    );
  }
  const report = await getFinancialReport();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">التقارير المالية</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          الإيراد والتكاليف والتحصيل والسداد حسب الفترة
        </p>
      </div>
      <FinancialReport
        initialSummary={{
          revenue: report.revenue,
          costs: report.costs,
          gross: report.gross,
          collections: report.collections,
          settlements: report.settlements,
          receivableTotal: report.receivableTotal,
          payableTotal: report.payableTotal,
        }}
        initialPayments={report.payments}
      />
    </div>
  );
}
