import { randomUUID } from "crypto";

import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export interface AuditInput {
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
}

export async function logAudit(input: AuditInput): Promise<void> {
  await db.insert(auditLogs).values({
    id: `audit_${randomUUID().slice(0, 8)}`,
    userId: input.userId ?? null,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    details: input.details ?? null,
    ipAddress: input.ipAddress ?? null,
  });
}
