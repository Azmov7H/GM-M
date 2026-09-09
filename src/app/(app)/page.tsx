import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/current-user";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LowStockTable, RecentSalesTable } from "@/components/reports/dashboard-tables";
import {
  Boxes,
  ChartNoAxesCombined,
  Package,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { getDashboard } from "@/server/services/report.service";

const quickActions = [
  { title: "نقطة البيع", href: "/sales/pos", icon: Store, variant: "default" as const },
  {
    title: "المنتجات",
    href: "/inventory/products",
    icon: Package,
    variant: "outline" as const,
  },
  { title: "المالية", href: "/finance/debts", icon: Wallet, variant: "outline" as const },
  {
    title: "التقارير",
    href: "/reports/sales",
    icon: ChartNoAxesCombined,
    variant: "outline" as const,
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const d = await getDashboard();

  const stats = [
    {
      title: "مبيعات اليوم",
      value: d.todayRevenue.toFixed(2),
      sub: `${d.todaySalesCount} فاتورة`,
      icon: ShoppingCart,
    },
    {
      title: "إجمالي الإيراد",
      value: d.totalRevenue.toFixed(2),
      sub: `${d.totalSalesCount} فاتورة`,
      icon: Wallet,
    },
    {
      title: "المنتجات",
      value: String(d.productCount),
      sub: `${d.lowStockCount} ناقص`,
      icon: Package,
    },
    {
      title: "العملاء",
      value: String(d.customerCount),
      sub: `مستحق ${d.receivableTotal.toFixed(2)}`,
      icon: Users,
    },
  ];

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
                  <p className="text-2xl font-semibold">
                    <span dir="ltr">{stat.value}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">{stat.sub}</p>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>أحدث المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSalesTable rows={d.recentSales} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="size-4" />
              نواقص المخزون ({d.lowStockCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LowStockTable rows={d.lowStock} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
