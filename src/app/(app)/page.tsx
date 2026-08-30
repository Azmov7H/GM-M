import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Boxes,
  ChartNoAxesCombined,
  Package,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { title: "المنتجات", value: "—", icon: Package },
  { title: "المخزون", value: "—", icon: Boxes },
  { title: "مبيعات اليوم", value: "0", icon: ShoppingCart },
  { title: "العملاء", value: "—", icon: Users },
];

const quickActions = [
  { title: "نقطة البيع", href: "/sales/pos", icon: Store, variant: "default" as const },
  {
    title: "المنتجات",
    href: "/inventory/products",
    icon: Package,
    variant: "outline" as const,
  },
  { title: "المالية", href: "/finance", icon: Wallet, variant: "outline" as const },
  {
    title: "التقارير",
    href: "/reports",
    icon: ChartNoAxesCombined,
    variant: "outline" as const,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            نظرة عامة على أداء المخزون والمبيعات
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          الإصدار 0.1.0
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm">{stat.title}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={buttonVariants({ variant: action.variant })}
              >
                <Icon />
                {action.title}
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أنشطة اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ChartNoAxesCombined}
            title="لا توجد بيانات بعد"
            description="ستظهر هنا المبيعات وحركات المخزون وأخر المستجدات عند بدء استخدام النظام."
          />
        </CardContent>
      </Card>
    </div>
  );
}
