import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getShortageReport } from "@/server/services/report.service";
import { ShortageReport } from "@/components/reports/shortage-report";
import { PageError } from "@/components/shared/page-error";

export default async function ShortagePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.permissions, "reports:view")) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">النواقص</h1>
        </div>
        <PageError
          title="صلاحية غير كافية"
          description="تحتاج إلى صلاحية عرض التقارير."
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">النواقص</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          الأصناف تحت الحد الأدنى في المخازن
        </p>
      </div>
      <ShortageReport initialRows={await getShortageReport()} />
    </div>
  );
}
