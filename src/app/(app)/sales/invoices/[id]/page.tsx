import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getSale } from "@/server/services/sale.service";
import { InvoiceDetail } from "@/components/sales/invoice-detail";
import { PageError } from "@/components/shared/page-error";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.permissions, "invoices:read")) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">تفاصيل الفاتورة</h1>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض الفواتير للوصول إلى هذه الصفحة."
        />
      </div>
    );
  }

  const sale = await getSale(id);
  if (!sale) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight print:hidden">
        فاتورة <span dir="ltr">#{sale.invoiceNumber}</span>
      </h1>
      <InvoiceDetail
        sale={sale}
        canReturn={hasPermission(user.permissions, "invoices:return")}
        canCancel={hasPermission(user.permissions, "invoices:delete")}
      />
    </div>
  );
}
