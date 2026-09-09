import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listMovements, listWarehouses } from "@/server/services/stock.service";
import { MovementsManager } from "@/components/inventory/movements-manager";
import { PageError } from "@/components/shared/page-error";

export default async function MovementsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.permissions, "stock:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">حركات المخزون</h1>
          <p className="text-muted-foreground mt-1 text-sm">سجل حركات الأصناف</p>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض المخزون للوصول إلى هذه الصفحة."
        />
      </div>
    );
  }

  const [movements, warehouses] = await Promise.all([
    listMovements({ limit: 200 }),
    listWarehouses(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">حركات المخزون</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          سجل حركات الأصناف (أحدث 200 حركة)
        </p>
      </div>
      <MovementsManager initialMovements={movements} warehouses={warehouses} />
    </div>
  );
}
