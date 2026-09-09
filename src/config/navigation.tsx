import {
  Boxes,
  ChartNoAxesCombined,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  badge?: number | string;
  cta?: boolean;
  keyword: string;
  children?: NavItem[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const appName = "نظام الجماز";
export const appVersion = "v0.1.0";

export const navSections: NavSection[] = [
  {
    items: [
      {
        title: "الرئيسية",
        href: "/",
        icon: LayoutDashboard,
        keyword: "لوحة القيادة الرئيسية",
      },
      {
        title: "المبيعات",
        href: "/sales",
        icon: ReceiptText,
        keyword: "المبيعات الفواتير نقطة البيع",
        children: [
          {
            title: "نقطة البيع",
            href: "/sales/pos",
            icon: Store,
            keyword: "نقطة البيع الكاشير",
            cta: true,
          },
          {
            title: "سجل الفواتير",
            href: "/sales/invoices",
            icon: FileText,
            keyword: "سجل الفواتير المبيعات",
          },
          {
            title: "مرتجع المبيعات",
            href: "/sales/returns",
            icon: ShoppingCart,
            keyword: "مرتجع المبيعات الاسترجاع",
          },
        ],
      },
      {
        title: "المخزون",
        href: "/inventory",
        icon: Boxes,
        keyword: "المخزون المنتجات",
        children: [
          {
            title: "المنتجات",
            href: "/inventory/products",
            icon: Package,
            keyword: "المنتجات الاصناف",
          },
          {
            title: "المخزون الحالي",
            href: "/inventory/stock",
            icon: Boxes,
            keyword: "المخزون الحالي الكميات",
          },
          {
            title: "حركات المخزون",
            href: "/inventory/movements",
            icon: ShoppingCart,
            keyword: "حركات المخزون",
          },
          {
            title: "الجرد الفعلي",
            href: "/inventory/counts",
            icon: ClipboardList,
            keyword: "الجرد الفعلي الجرد الميداني",
          },
          {
            title: "أوامر الشراء",
            href: "/inventory/purchase-orders",
            icon: ShoppingCart,
            keyword: "أوامر الشراء المشتريات",
          },
        ],
      },
      {
        title: "العملاء والموردين",
        href: "/parties",
        icon: Users,
        keyword: "العملاء الموردين",
        children: [
          {
            title: "العملاء",
            href: "/parties/customers",
            icon: Users,
            keyword: "العملاء",
          },
          {
            title: "الموردين",
            href: "/parties/suppliers",
            icon: Store,
            keyword: "الموردين",
          },
        ],
      },
      {
        title: "المالية",
        href: "/finance",
        icon: CreditCard,
        keyword: "المالية الخزينة الديون",
        children: [
          {
            title: "الخزينة",
            href: "/finance/cashier",
            icon: Wallet,
            keyword: "الخزينة النقدية",
          },
          {
            title: "الديون",
            href: "/finance/debts",
            icon: CreditCard,
            keyword: "الديون الحسابات",
          },
        ],
      },
      {
        title: "التقارير",
        href: "/reports",
        icon: ChartNoAxesCombined,
        keyword: "التقارير الاحصائيات",
        children: [
          {
            title: "تقرير المبيعات",
            href: "/reports/sales",
            icon: ChartNoAxesCombined,
            keyword: "تقرير المبيعات",
          },
          {
            title: "التقارير المالية",
            href: "/reports/financial",
            icon: CreditCard,
            keyword: "التقارير المالية",
          },
          {
            title: "النواقص",
            href: "/reports/shortage",
            icon: Boxes,
            keyword: "النواقص المخزون المنخفض",
          },
        ],
      },
      {
        title: "النظام",
        href: "/system",
        icon: Settings,
        keyword: "النظام الاعدادات المستخدمين",
        children: [
          {
            title: "المستخدمين",
            href: "/system/users",
            icon: Users,
            keyword: "المستخدمين",
          },
          {
            title: "الإعدادات",
            href: "/system/settings",
            icon: Settings,
            keyword: "الإعدادات الاعدادات",
          },
        ],
      },
    ],
  },
];
