/**
 * Convert a UTC ISO string into the local wall-clock value expected by an
 * `<input type="datetime-local">` (format `YYYY-MM-DDTHH:mm`).
 *
 * A datetime-local input has NO timezone — it treats its value as local time.
 * `new Date(iso).toISOString()` would yield the UTC time, which renders ~hours
 * off from how the same instant is shown elsewhere via `toLocaleString`. We
 * subtract the timezone offset so the input shows the same local time the user
 * sees on cards. Pairs with `new Date(inputValue).toISOString()` on save, which
 * converts the local value back to UTC.
 */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
