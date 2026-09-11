import { and, gte, lt, ne } from "drizzle-orm";

import { db } from "@/server/db";
import { payments, saleReturns, sales } from "@/server/db/schema";

function dayRange(date: string) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return { from: date, to: next.toISOString().slice(0, 10) };
}

export async function getCashierSummary(date = new Date().toISOString().slice(0, 10)) {
  const { from, to } = dayRange(date);

  const [saleRows, paymentRows, returnRows] = await Promise.all([
    db
      .select({
        total: sales.total,
        discount: sales.discount,
        paymentType: sales.paymentType,
      })
      .from(sales)
      .where(
        and(
          ne(sales.status, "cancelled"),
          gte(sales.createdAt, from),
          lt(sales.createdAt, to),
        ),
      ),
    db
      .select({ amount: payments.amount, entityType: payments.entityType })
      .from(payments)
      .where(and(gte(payments.createdAt, from), lt(payments.createdAt, to))),
    db
      .select({ total: saleReturns.total })
      .from(saleReturns)
      .where(and(gte(saleReturns.createdAt, from), lt(saleReturns.createdAt, to))),
  ]);

  const sum = (rs: { total?: number | null; amount?: number | null }[]) =>
    rs.reduce((s, r) => s + (r.total ?? r.amount ?? 0), 0);

  const cashSales = saleRows.filter((r) => r.paymentType === "cash");
  const creditSales = saleRows.filter((r) => r.paymentType !== "cash");
  const collected = paymentRows.filter((r) => r.entityType === "customer");
  const paidOut = paymentRows.filter((r) => r.entityType === "supplier");

  return {
    date,
    invoiceCount: saleRows.length,
    cashTotal: sum(cashSales),
    creditTotal: sum(creditSales),
    discountTotal: saleRows.reduce((s, r) => s + (r.discount ?? 0), 0),
    collectedTotal: sum(collected),
    paidOutTotal: sum(paidOut),
    returnsTotal: sum(returnRows),
    returnsCount: returnRows.length,
    expectedCash: sum(cashSales) + sum(collected) - sum(paidOut) - sum(returnRows),
  };
}
