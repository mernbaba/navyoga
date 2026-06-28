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

// ---------------------------------------------------------------------------
// IST display formatting
//
// Class schedules and sessions are stored as absolute timestamps. Comparisons
// against "now" are timezone-independent, but *display* must always show IST
// wall-clock so every user — student, tutor, operations, or superadmin — sees
// the same India time regardless of their device timezone.
// ---------------------------------------------------------------------------

export const IST_TIME_ZONE = "Asia/Kolkata";

const IST_DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: IST_TIME_ZONE,
});

const IST_DATE_TIME_YEAR = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: IST_TIME_ZONE,
});

const IST_DATE_ONLY = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: IST_TIME_ZONE,
});

const IST_TIME_ONLY = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: IST_TIME_ZONE,
});

function toValidDate(
  value: string | number | Date | null | undefined,
): Date | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Mon, Jun 27, 5:30 PM" in IST. */
export function formatISTDateTime(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const d = toValidDate(value);
  return d ? IST_DATE_TIME.format(d) : fallback;
}

/** "27 Jun 2026, 05:30 PM" in IST. */
export function formatISTDateTimeYear(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const d = toValidDate(value);
  return d ? IST_DATE_TIME_YEAR.format(d) : fallback;
}

/** "27 Jun 2026" in IST. */
export function formatISTDate(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const d = toValidDate(value);
  return d ? IST_DATE_ONLY.format(d) : fallback;
}

/** "5:30 PM" in IST. */
export function formatISTTime(
  value: string | number | Date | null | undefined,
  fallback = "—",
): string {
  const d = toValidDate(value);
  return d ? IST_TIME_ONLY.format(d) : fallback;
}

// ---------------------------------------------------------------------------
// Join window
//
// A live class's Join/Start button unlocks JOIN_WINDOW_MINUTES before the
// scheduled start and stays unlocked until the class is scheduled to end
// (start + duration). Tutor ("Start") and student ("Join Live") surfaces both
// go through `isWithinJoinWindow` so they unlock at exactly the same moment.
// ---------------------------------------------------------------------------

/** Minutes before scheduled start that the Join/Start button unlocks. */
export const JOIN_WINDOW_MINUTES = 15;

export function isWithinJoinWindow(opts: {
  scheduledAt: string | null | undefined;
  durationMinutes?: number | null;
  /** Already started (and not ended) — always joinable. */
  isLive?: boolean;
}): boolean {
  if (opts.isLive) return true;
  const start = toValidDate(opts.scheduledAt);
  if (!start) return false;
  const startMs = start.getTime();
  const now = Date.now();
  const opensAt = startMs - JOIN_WINDOW_MINUTES * 60_000;
  const closesAt = startMs + (opts.durationMinutes ?? 0) * 60_000;
  return now >= opensAt && now <= closesAt;
}
