import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getSale } from "@/server/services/sale.service";
import { getSettings } from "@/server/services/settings.service";
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

  const s = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight print:hidden">
        فاتورة <span dir="ltr">#{sale.invoiceNumber}</span>
      </h1>
      <InvoiceDetail
        sale={sale}
        canReturn={hasPermission(user.permissions, "invoices:return")}
        canCancel={hasPermission(user.permissions, "invoices:delete")}
        branding={{
          companyName: s["company.name"],
          companyPhone: s["company.phone"],
          companyAddress: s["company.address"],
          currency: s["company.currency"],
          footer: s["company.footer"],
          template: s["invoice.template"] === "compact" ? "compact" : "standard",
          paper: s["invoice.paper"] === "80mm" ? "80mm" : "a4",
          showCustomer: s["invoice.show_customer"] === "true",
          showPayment: s["invoice.show_payment"] === "true",
          showCashier: s["invoice.show_cashier"] === "true",
        }}
      />
    </div>
  );
}
