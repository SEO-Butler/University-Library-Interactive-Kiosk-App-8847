// Database rows are snake_case; both APIs speak camelCase.
export function camelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function toCamel(row) {
  if (row === null || row === undefined) return row;
  if (Array.isArray(row)) return row.map(toCamel);
  if (typeof row !== 'object' || row instanceof Date) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[camelKey(key)] = value;
  }
  return out;
}

// Builds a parameterised INSERT from a {column: value} object.
export function insertSql(table, data) {
  const columns = Object.keys(data);
  const params = columns.map((_, i) => `$${i + 1}`);
  return {
    text: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${params.join(', ')}) RETURNING *`,
    values: Object.values(data)
  };
}

export function updateSql(table, id, data) {
  const columns = Object.keys(data);
  const sets = columns.map((column, i) => `${column} = $${i + 2}`);
  return {
    text: `UPDATE ${table} SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`,
    values: [id, ...Object.values(data)]
  };
}
