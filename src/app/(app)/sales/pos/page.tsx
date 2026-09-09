import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { listWarehouses } from "@/server/services/stock.service";
import { listCustomers } from "@/server/services/customer.service";
import { PosTerminal } from "@/components/sales/pos-terminal";
import { PageError } from "@/components/shared/page-error";

export default async function PosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.permissions, "invoices:create")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">نقطة البيع</h1>
          <p className="text-muted-foreground mt-1 text-sm">إنشاء فواتير المبيعات</p>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية إنشاء الفواتير للوصول إلى نقطة البيع."
        />
      </div>
    );
  }

  const [warehouses, customers] = await Promise.all([listWarehouses(), listCustomers()]);
  const defaultWarehouse = warehouses.find((w) => w.code === "SH-01") ?? warehouses[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">نقطة البيع</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          ابحث وأضف الأصناف ثم أتمم الدفع — الاختصارات: F2 بحث، Enter إضافة، Ctrl+Enter
          إتمام
        </p>
      </div>
      {warehouses.length === 0 ? (
        <PageError
          title="لا توجد مخازن"
          description="أنشئ مخزناً أولاً قبل استخدام نقطة البيع."
        />
      ) : (
        <PosTerminal
          warehouses={warehouses}
          customers={customers}
          defaultWarehouseId={defaultWarehouse.id}
        />
      )}
    </div>
  );
}
