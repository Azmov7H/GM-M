import { asc, desc, eq, isNull } from "drizzle-orm";

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
function inRange(createdAt: string, range: DateRange) {
  const day = createdAt.slice(0, 10);
  if (range.from && DATE_RE.test(range.from) && day < range.from) return false;
  if (range.to && DATE_RE.test(range.to) && day > range.to) return false;
  return true;
}

// ---------------------------------------------------------------- dashboard
export async function getDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [saleRows, levels, productRows, customerRows, custBalances, suppBalances] =
    await Promise.all([
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
        .limit(50),
      getStockLevels(),
      db.select({ id: products.id }).from(products).where(isNull(products.deletedAt)),
      db.select({ id: customers.id }).from(customers).where(isNull(customers.deletedAt)),
      db
        .select({ balance: customers.balance })
        .from(customers)
        .where(isNull(customers.deletedAt)),
      db
        .select({ balance: suppliers.balance })
        .from(suppliers)
        .where(isNull(suppliers.deletedAt)),
    ]);
  const valid = saleRows.filter((r) => r.status !== "cancelled");
  const todayRows = valid.filter((r) => r.createdAt.slice(0, 10) === today);
  const sum = (rs: { total: number }[]) => rs.reduce((s, r) => s + r.total, 0);
  const low = levels.filter((l) => l.isLow);
  return {
    todayRevenue: sum(todayRows),
    todaySalesCount: todayRows.length,
    totalRevenue: sum(valid),
    totalSalesCount: valid.length,
    productCount: productRows.length,
    customerCount: customerRows.length,
    receivableTotal: custBalances.reduce((s, r) => s + (r.balance ?? 0), 0),
    payableTotal: suppBalances.reduce((s, r) => s + (r.balance ?? 0), 0),
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
    .orderBy(desc(sales.invoiceNumber))
    .limit(1000);
  const valid = rows.filter(
    (r) => r.status !== "cancelled" && inRange(r.createdAt, range),
  );
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
  const [saleRows, purchaseRows, paymentRows, custBalances, suppBalances] =
    await Promise.all([
      db
        .select({ total: sales.total, status: sales.status, createdAt: sales.createdAt })
        .from(sales),
      db
        .select({
          total: purchases.total,
          status: purchases.status,
          createdAt: purchases.createdAt,
        })
        .from(purchases),
      db.select().from(payments).orderBy(desc(payments.createdAt)).limit(1000),
      db
        .select({ balance: customers.balance })
        .from(customers)
        .where(isNull(customers.deletedAt)),
      db
        .select({ balance: suppliers.balance })
        .from(suppliers)
        .where(isNull(suppliers.deletedAt)),
    ]);
  const revenue = saleRows
    .filter((r) => r.status !== "cancelled" && inRange(r.createdAt, range))
    .reduce((s, r) => s + r.total, 0);
  const costs = purchaseRows
    .filter((r) => r.status !== "cancelled" && inRange(r.createdAt, range))
    .reduce((s, r) => s + r.total, 0);
  const inRangePayments = paymentRows.filter((p) => inRange(p.createdAt, range));
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
    receivableTotal: custBalances.reduce((s, r) => s + (r.balance ?? 0), 0),
    payableTotal: suppBalances.reduce((s, r) => s + (r.balance ?? 0), 0),
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
  const [saleRows, itemRows, productRows] = await Promise.all([
    db
      .select({
        id: sales.id,
        customerId: sales.customerId,
        customerName: customers.name,
        status: sales.status,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id)),
    db.select().from(saleItems),
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
    if (s.status === "cancelled" || !inRange(s.createdAt, range)) continue;
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
