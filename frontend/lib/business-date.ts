/**
 * Returns today's "business date" (YYYY-MM-DD) in local time.
 * The shop runs ~11am–3am, so anything before the cutoff hour
 * still counts as the previous business day.
 */
export function getBusinessDate(cutoffHour = 3): string {
  const now = new Date();
  if (now.getHours() < cutoffHour) {
    now.setDate(now.getDate() - 1);
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}