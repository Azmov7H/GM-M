import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getSalesReport } from "@/server/services/report.service";
import { SalesReport } from "@/components/reports/sales-report";
import { PageError } from "@/components/shared/page-error";

export default async function SalesReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "reports:view")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تقرير المبيعات</h1>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض التقارير."
        />
      </div>
    );
  }
  const report = await getSalesReport();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">تقرير المبيعات</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          الفواتير والإيراد حسب الفترة مع التصدير
        </p>
      </div>
      <SalesReport
        initialRows={report.rows}
        initialTotals={{
          totalRevenue: report.totalRevenue,
          totalCount: report.totalCount,
          avgInvoice: report.avgInvoice,
        }}
      />
    </div>
  );
}
