import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getCustomerDetail } from "@/server/services/party.service";
import { PartyDetail } from "@/components/parties/party-detail";
import { PageError } from "@/components/shared/page-error";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "customers:read")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">بيانات العميل</h1>
        </div>
        <PageError title="صلاحية غير كافية" description="تحتاج إلى صلاحية عرض العملاء." />
      </div>
    );
  }
  const data = await getCustomerDetail(id);
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          بيانات العميل وحركاته ودفعاته
        </p>
      </div>
      <PartyDetail
        kind="customers"
        txnTitle="الفواتير"
        txnEmpty="لا فواتير لهذا العميل"
        data={{ ...data, transactions: data.sales }}
        canRecordPayment={hasPermission(user.permissions, "customers:update")}
      />
    </div>
  );
}
