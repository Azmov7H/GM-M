import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getStockLevels, listWarehouses } from "@/server/services/stock.service";
import { listProducts } from "@/server/services/product.service";
import { StockManager } from "@/components/inventory/stock-manager";
import { PageError } from "@/components/shared/page-error";

export default async function StockPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.permissions, "stock:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المخزون الحالي</h1>
          <p className="text-muted-foreground mt-1 text-sm">أرصدة الأصناف في المخازن</p>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض المخزون للوصول إلى هذه الصفحة."
        />
      </div>
    );
  }

  const [levels, warehouses, products] = await Promise.all([
    getStockLevels(),
    listWarehouses(),
    listProducts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">المخزون الحالي</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          أرصدة الأصناف في المخازن — {levels.filter((l) => l.isLow).length} صنف ناقص
        </p>
      </div>
      <StockManager
        initialLevels={levels}
        products={products.map((p) => ({ id: p.id, name: p.name, code: p.code }))}
        warehouses={warehouses}
        canTransfer={hasPermission(user.permissions, "stock:transfer")}
        canAdjust={hasPermission(user.permissions, "stock:manage")}
      />
    </div>
  );
}
