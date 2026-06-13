// apps/admin/lib/audit.ts
import { pool } from "@/core/db";

export async function logAudit({
  actorId,
  action,
  entity,
  entityId,
  metadata
}: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
}) {
  await pool.query(
    `
    INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [actorId, action, entity, entityId, metadata]
  );
}
