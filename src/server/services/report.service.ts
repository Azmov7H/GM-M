import { and, asc, desc, eq, gte, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import type { SQL, SQLWrapper } from "drizzle-orm";

import { db } from "@/server/db";
import {
  customers,
  payments,
  products,
  purchaseItems,
  purchases,
  saleItems,
  sales,
  suppliers,
} from "@/server/db/schema";
import { getStockLevels } from "./stock.service";

export interface DateRange {
  from?: string;
  to?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * SQL date-range predicates on an ISO-text createdAt column. Filters in the
 * database (index-backed) instead of fetching full tables into JS.
 */
function rangeConditions(column: SQLWrapper, range: DateRange): SQL<unknown>[] {
  const conds: SQL<unknown>[] = [];
  if (range.from && DATE_RE.test(range.from)) {
    conds.push(gte(column, range.from));
  }
  if (range.to && DATE_RE.test(range.to)) {
    const t = new Date(`${range.to}T00:00:00Z`).getTime();
    if (Number.isFinite(t)) {
      conds.push(lt(column, new Date(t + 24 * 60 * 60 * 1000).toISOString()));
    }
  }
  return conds;
}

// ---------------------------------------------------------------- dashboard
export async function getDashboard() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const validSale = ne(sales.status, "cancelled");
  const revenueAgg = {
    revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
    count: sql<number>`count(*)`,
  };
  const balanceAgg = {
    total: sql<number>`coalesce(sum(${customers.balance}), 0)`,
  };
  const payableAgg = {
    total: sql<number>`coalesce(sum(${suppliers.balance}), 0)`,
  };
  const [
    todayAgg,
    totalAgg,
    productCount,
    customerCount,
    recvAgg,
    payAgg,
    saleRows,
    levels,
  ] = await Promise.all([
    db
      .select(revenueAgg)
      .from(sales)
      .where(and(validSale, gte(sales.createdAt, today), lt(sales.createdAt, tomorrow))),
    db.select(revenueAgg).from(sales).where(validSale),
    db.$count(products, isNull(products.deletedAt)),
    db.$count(customers, isNull(customers.deletedAt)),
    db.select(balanceAgg).from(customers).where(isNull(customers.deletedAt)),
    db.select(payableAgg).from(suppliers).where(isNull(suppliers.deletedAt)),
    db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        customerName: customers.name,
        total: sales.total,
        status: sales.status,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .orderBy(desc(sales.invoiceNumber))
      .limit(8),
    getStockLevels(),
  ]);
  const valid = saleRows.filter((r) => r.status !== "cancelled");
  const low = levels.filter((l) => l.isLow);
  return {
    todayRevenue: todayAgg[0]?.revenue ?? 0,
    todaySalesCount: todayAgg[0]?.count ?? 0,
    totalRevenue: totalAgg[0]?.revenue ?? 0,
    totalSalesCount: totalAgg[0]?.count ?? 0,
    productCount,
    customerCount,
    receivableTotal: recvAgg[0]?.total ?? 0,
    payableTotal: payAgg[0]?.total ?? 0,
    lowStockCount: low.length,
    recentSales: valid.slice(0, 8),
    lowStock: low.slice(0, 8),
  };
}

// ---------------------------------------------------------------- sales report
export async function getSalesReport(range: DateRange = {}) {
  const rows = await db
    .select({
      id: sales.id,
      invoiceNumber: sales.invoiceNumber,
      customerName: customers.name,
      userId: sales.userId,
      subtotal: sales.subtotal,
      discount: sales.discount,
      tax: sales.tax,
      total: sales.total,
      paymentType: sales.paymentType,
      paymentStatus: sales.paymentStatus,
      status: sales.status,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .where(and(ne(sales.status, "cancelled"), ...rangeConditions(sales.createdAt, range)))
    .orderBy(desc(sales.invoiceNumber))
    .limit(1000);
  const valid = rows;
  const revenue = valid.reduce((s, r) => s + r.total, 0);
  return {
    rows: valid,
    totalRevenue: revenue,
    totalCount: valid.length,
    avgInvoice: valid.length > 0 ? revenue / valid.length : 0,
  };
}

// ---------------------------------------------------------------- financial
export async function getFinancialReport(range: DateRange = {}) {
  const saleConds = [
    ne(sales.status, "cancelled"),
    ...rangeConditions(sales.createdAt, range),
  ];
  const purchaseConds = [
    ne(purchases.status, "cancelled"),
    ...rangeConditions(purchases.createdAt, range),
  ];
  const [saleAgg, purchaseAgg, paymentRows, recvAgg, payAgg] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${sales.total}), 0)` })
      .from(sales)
      .where(and(...saleConds)),
    db
      .select({ total: sql<number>`coalesce(sum(${purchases.total}), 0)` })
      .from(purchases)
      .where(and(...purchaseConds)),
    db
      .select()
      .from(payments)
      .where(and(...rangeConditions(payments.createdAt, range)))
      .orderBy(desc(payments.createdAt))
      .limit(1000),
    db
      .select({ total: sql<number>`coalesce(sum(${customers.balance}), 0)` })
      .from(customers)
      .where(isNull(customers.deletedAt)),
    db
      .select({ total: sql<number>`coalesce(sum(${suppliers.balance}), 0)` })
      .from(suppliers)
      .where(isNull(suppliers.deletedAt)),
  ]);
  const revenue = saleAgg[0]?.total ?? 0;
  const costs = purchaseAgg[0]?.total ?? 0;
  const inRangePayments = paymentRows;
  const collections = inRangePayments
    .filter((p) => p.entityType === "customer")
    .reduce((s, p) => s + p.amount, 0);
  const settlements = inRangePayments
    .filter((p) => p.entityType === "supplier")
    .reduce((s, p) => s + p.amount, 0);
  return {
    revenue,
    costs,
    gross: revenue - costs,
    collections,
    settlements,
    receivableTotal: recvAgg[0]?.total ?? 0,
    payableTotal: payAgg[0]?.total ?? 0,
    payments: inRangePayments.slice(0, 200),
  };
}

// ------------------------------------------------------- profit by customer
export interface CustomerProfitRow {
  customerId: string | null;
  customerName: string;
  invoiceCount: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export async function getProfitByCustomer(range: DateRange = {}) {
  const saleRows = await db
    .select({
      id: sales.id,
      customerId: sales.customerId,
      customerName: customers.name,
      status: sales.status,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .where(
      and(ne(sales.status, "cancelled"), ...rangeConditions(sales.createdAt, range)),
    );
  const saleIds = saleRows.map((s) => s.id);
  const [itemRows, productRows] = await Promise.all([
    saleIds.length > 0
      ? db.select().from(saleItems).where(inArray(saleItems.saleId, saleIds))
      : [],
    db.select({ id: products.id, buyPrice: products.buyPrice }).from(products),
  ]);
  const costByProduct = new Map(productRows.map((p) => [p.id, p.buyPrice ?? 0]));
  const itemsBySale = new Map<string, typeof itemRows>();
  for (const it of itemRows) {
    const arr = itemsBySale.get(it.saleId) ?? [];
    arr.push(it);
    itemsBySale.set(it.saleId, arr);
  }
  const byCustomer = new Map<string, CustomerProfitRow>();
  for (const s of saleRows) {
    const key = s.customerId ?? "__cash__";
    let row = byCustomer.get(key);
    if (!row) {
      row = {
        customerId: s.customerId,
        customerName: s.customerName ?? "بيع نقدي (بدون عميل)",
        invoiceCount: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
      };
      byCustomer.set(key, row);
    }
    row.invoiceCount += 1;
    for (const it of itemsBySale.get(s.id) ?? []) {
      const netQty = Math.max(0, it.quantity - (it.returnedQuantity ?? 0));
      row.revenue += netQty * it.unitPrice;
      // service lines carry no cost; goods costed at current buy price
      if (!it.isService && it.productId)
        row.cost += netQty * (costByProduct.get(it.productId) ?? 0);
    }
  }
  const out: CustomerProfitRow[] = [...byCustomer.values()].map((r) => ({
    customerId: r.customerId,
    customerName: r.customerName,
    invoiceCount: r.invoiceCount,
    revenue: r.revenue,
    cost: r.cost,
    profit: r.revenue - r.cost,
    margin: r.revenue > 0 ? ((r.revenue - r.cost) / r.revenue) * 100 : 0,
  }));
  out.sort((a, b) => b.profit - a.profit);
  const totals = out.reduce(
    (s, r) => ({
      revenue: s.revenue + r.revenue,
      cost: s.cost + r.cost,
      profit: s.profit + r.profit,
    }),
    { revenue: 0, cost: 0, profit: 0 },
  );
  return { rows: out, totals };
}

// ------------------------------------------------------------ price history
export interface PricePoint {
  date: string;
  kind: "sale" | "purchase";
  price: number;
  quantity: number;
  reference: string;
}

export async function getPriceHistory(productId: string, limit = 100) {
  const [sellRows, buyRows] = await Promise.all([
    db
      .select({
        unitPrice: saleItems.unitPrice,
        quantity: saleItems.quantity,
        createdAt: sales.createdAt,
        invoiceNumber: sales.invoiceNumber,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(eq(saleItems.productId, productId))
      .orderBy(desc(sales.createdAt))
      .limit(limit),
    db
      .select({
        unitCost: purchaseItems.unitCost,
        quantity: purchaseItems.quantity,
        createdAt: purchases.createdAt,
        orderNumber: purchases.orderNumber,
      })
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
      .where(eq(purchaseItems.productId, productId))
      .orderBy(desc(purchases.createdAt))
      .limit(limit),
  ]);
  const points: PricePoint[] = [
    ...sellRows.map((r) => ({
      date: r.createdAt,
      kind: "sale" as const,
      price: r.unitPrice,
      quantity: r.quantity,
      reference: `فاتورة #${r.invoiceNumber}`,
    })),
    ...buyRows.map((r) => ({
      date: r.createdAt,
      kind: "purchase" as const,
      price: r.unitCost,
      quantity: r.quantity,
      reference: `أمر #${r.orderNumber}`,
    })),
  ];
  points.sort((a, b) => (a.date < b.date ? 1 : -1));
  return points.slice(0, limit);
}

// ---------------------------------------------------------------- shortage
export async function getShortageReport() {
  const levels = await getStockLevels();
  return levels
    .filter((l) => l.isLow)
    .sort((a, b) => a.quantity - b.quantity)
    .map((l) => ({
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      warehouseId: l.warehouseId,
      warehouseName: l.warehouseName,
      quantity: l.quantity,
      minLevel: l.minLevel,
    }));
}

// product options for the price-history picker
export async function listReportProducts() {
  return db
    .select({ id: products.id, code: products.code, name: products.name })
    .from(products)
    .where(isNull(products.deletedAt))
    .orderBy(asc(products.name))
    .limit(500);
}
