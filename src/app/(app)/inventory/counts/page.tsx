import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listCounts } from "@/server/services/physical-inventory.service";
import { listWarehouses } from "@/server/services/stock.service";
import { CountsManager } from "@/components/inventory/counts-manager";
import { PageError } from "@/components/shared/page-error";

export default async function CountsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.permissions, "physical_inventory:manage")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الجرد الفعلي</h1>
          <p className="text-muted-foreground mt-1 text-sm">جلسات الجرد الميداني</p>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية إدارة الجرد الفعلي للوصول إلى هذه الصفحة."
        />
      </div>
    );
  }

  const [counts, warehouses] = await Promise.all([listCounts(), listWarehouses()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">الجرد الفعلي</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          جلسات الجرد الميداني واعتماد الفروقات
        </p>
      </div>
      <CountsManager initialCounts={counts} warehouses={warehouses} />
    </div>
  );
}
