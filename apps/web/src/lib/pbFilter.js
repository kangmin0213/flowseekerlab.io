/**
 * Escape a value for use inside PocketBase filter double-quoted strings.
 */
export function escapePbFilter(str) {
  if (str == null) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
