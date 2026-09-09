import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getSalesStats, listSales } from "@/server/services/sale.service";
import { InvoicesManager } from "@/components/sales/invoices-manager";
import { PageError } from "@/components/shared/page-error";

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.permissions, "invoices:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">سجل الفواتير</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            فواتير المبيعات وإحصائياتها
          </p>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض الفواتير للوصول إلى هذه الصفحة."
        />
      </div>
    );
  }

  const [sales, stats] = await Promise.all([listSales({ limit: 200 }), getSalesStats()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">سجل الفواتير</h1>
        <p className="text-muted-foreground mt-1 text-sm">فواتير المبيعات وإحصائياتها</p>
      </div>
      <InvoicesManager initialSales={sales} stats={stats} />
    </div>
  );
}
