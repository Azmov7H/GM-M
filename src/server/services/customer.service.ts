import { asc } from "drizzle-orm";

import { db } from "@/server/db";
import { customers } from "@/server/db/schema";

/**
 * Minimal customer lookup for POS (full customer management is Phase 8).
 */
export async function listCustomers() {
  return db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      balance: customers.balance,
    })
    .from(customers)
    .orderBy(asc(customers.name));
}
