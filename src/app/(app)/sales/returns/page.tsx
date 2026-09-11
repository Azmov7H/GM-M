import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listSales } from "@/server/services/sale.service";
import { PageHeader } from "@/components/shared/page-header";
import { PageError } from "@/components/shared/page-error";
import { ReturnsManager } from "@/components/sales/returns-manager";

export default async function ReturnsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "invoices:return")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="مرتجع المبيعات" description="إرجاع أصناف من فواتير مكتملة" />
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية المرتجعات للوصول إلى هذه الصفحة."
        />
      </div>
    );
  }
  const sales = await listSales({ status: "completed", limit: 200 });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="مرتجع المبيعات"
        description="اختر فاتورة ثم حدد الأصناف والكميات المرتجعة"
      />
      <ReturnsManager initialSales={sales} />
    </div>
  );
}
