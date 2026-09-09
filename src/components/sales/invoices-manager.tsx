"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface InvoiceRow {
  id: string;
  invoiceNumber: number;
  customerName: string | null;
  userName: string | null;
  total: number;
  paymentType: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

const ALL = "__all__";

const STATUS_LABELS: Record<string, string> = {
  completed: "مكتملة",
  returned: "مرتجعة",
  cancelled: "ملغاة",
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "نقدي",
  credit: "آجل",
  bank: "بنكي",
  wallet: "محفظة",
  check: "شيك",
};

export function InvoicesManager({
  initialSales,
  stats,
}: {
  initialSales: InvoiceRow[];
  stats: {
    todayTotal: number;
    todayCount: number;
    totalRevenue: number;
    totalCount: number;
  };
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState(ALL);

  const filtered = initialSales.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      String(s.invoiceNumber).includes(q) ||
      (s.customerName ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === ALL || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>مبيعات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{stats.todayTotal.toFixed(2)}</span> ({stats.todayCount})
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>إجمالي الإيراد</CardTitle>
          </CardHeader>
          <CardContent>
            <span dir="ltr">{stats.totalRevenue.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>عدد الفواتير</CardTitle>
          </CardHeader>
          <CardContent>{stats.totalCount}</CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          className="max-w-xs flex-1"
          placeholder="بحث برقم الفاتورة أو العميل..."
          value={search}
          onValueChange={setSearch}
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? ALL)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الحالات</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
            <SelectItem value="returned">مرتجعة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable<InvoiceRow>
        data={filtered}
        rowKey={(r) => r.id}
        emptyTitle="لا توجد فواتير"
        emptyDescription="أنشئ أول فاتورة من نقطة البيع"
        onRowClick={(r) => router.push(`/sales/invoices/${r.id}`)}
        columns={[
          { header: "الرقم", cell: (r) => <span dir="ltr">#{r.invoiceNumber}</span> },
          { header: "العميل", cell: (r) => r.customerName ?? "نقدي" },
          {
            header: "الإجمالي",
            cell: (r) => <span dir="ltr">{r.total.toFixed(2)}</span>,
          },
          {
            header: "الدفع",
            cell: (r) => PAYMENT_LABELS[r.paymentType] ?? r.paymentType,
          },
          {
            header: "الحالة",
            cell: (r) => (
              <Badge variant={r.status === "cancelled" ? "destructive" : "outline"}>
                {STATUS_LABELS[r.status] ?? r.status}
              </Badge>
            ),
          },
          {
            header: "التاريخ",
            cell: (r) => new Date(r.createdAt).toLocaleString("ar"),
          },
        ]}
      />
    </div>
  );
}
