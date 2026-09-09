import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getPurchaseStats, listPurchases } from "@/server/services/purchase.service";
import { PurchasesManager } from "@/components/purchases/purchases-manager";
import { PageError } from "@/components/shared/page-error";

export default async function PurchaseOrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.permissions, "purchases:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">أوامر الشراء</h1>
          <p className="text-muted-foreground mt-1 text-sm">أوامر الشراء وإحصائياتها</p>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض المشتريات للوصول إلى هذه الصفحة."
        />
      </div>
    );
  }

  const [purchases, stats] = await Promise.all([listPurchases(), getPurchaseStats()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">أوامر الشراء</h1>
        <p className="text-muted-foreground mt-1 text-sm">أوامر الشراء وإحصائياتها</p>
      </div>
      <PurchasesManager initialPurchases={purchases} stats={stats} />
    </div>
  );
}
