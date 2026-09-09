import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getSupplierDetail } from "@/server/services/party.service";
import { PartyDetail } from "@/components/parties/party-detail";
import { PageError } from "@/components/shared/page-error";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "suppliers:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">بيانات المورد</h1>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض الموردين."
        />
      </div>
    );
  }
  const data = await getSupplierDetail(id);
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          بيانات المورد ومشترياته ودفعاته
        </p>
      </div>
      <PartyDetail
        kind="suppliers"
        txnTitle="أوامر الشراء"
        txnEmpty="لا أوامر شراء لهذا المورد"
        data={{ ...data, transactions: data.purchases }}
        canRecordPayment={hasPermission(user.permissions, "suppliers:update")}
      />
    </div>
  );
}
