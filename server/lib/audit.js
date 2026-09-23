// Records who changed what in the CMS. Failures are logged, never thrown: an audit
// problem must not block a content save.
export async function audit(pool, req, action, entity, entityId = null, details = null) {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, username, action, entity, entity_id, details, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user?.id ?? null,
        req.user?.username ?? null,
        action,
        entity,
        entityId === null || entityId === undefined ? null : String(entityId),
        details ? JSON.stringify(details) : null,
        req.ip ?? null
      ]
    );
  } catch (error) {
    console.error('[audit] could not write entry:', error.message);
  }
}
