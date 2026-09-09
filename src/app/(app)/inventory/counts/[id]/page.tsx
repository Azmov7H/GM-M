import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getCount } from "@/server/services/physical-inventory.service";
import { CountDetail } from "@/components/inventory/count-detail";
import { PageError } from "@/components/shared/page-error";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  counting: "جارٍ الجرد",
  completed: "مكتمل",
  approved: "معتمد",
  cancelled: "ملغي",
};

export default async function CountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.permissions, "physical_inventory:manage")) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">تفاصيل الجرد</h1>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية إدارة الجرد الفعلي للوصول إلى هذه الصفحة."
        />
      </div>
    );
  }

  const count = await getCount(id);
  if (!count) {
    notFound();
  }

  const editable =
    count.status === "draft" ||
    count.status === "counting" ||
    count.status === "completed";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{count.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {count.warehouseName ?? "كل المخازن"}
          </p>
        </div>
        <Badge variant="outline" className="ms-auto">
          {STATUS_LABELS[count.status] ?? count.status}
        </Badge>
      </div>
      <CountDetail
        countId={count.id}
        status={count.status}
        initialItems={count.items}
        editable={editable}
      />
    </div>
  );
}
