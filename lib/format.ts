/**
 * Format check-in time using Swarm timeZoneOffset (minutes),
 * not the viewer's browser timezone.
 * Output: `M/D HH:mm` e.g. `7/11 22:51`
 */
export function formatLocalAbsoluteTime(
  checkedInAt: string,
  timeZoneOffsetMinutes: number,
): string {
  const utcMs = Date.parse(checkedInAt);
  if (Number.isNaN(utcMs)) {
    return "";
  }

  const local = new Date(utcMs + timeZoneOffsetMinutes * 60_000);
  const month = local.getUTCMonth() + 1;
  const day = local.getUTCDate();
  const hours = String(local.getUTCHours()).padStart(2, "0");
  const minutes = String(local.getUTCMinutes()).padStart(2, "0");

  return `${month}/${day} ${hours}:${minutes}`;
}

/** Region line: `{state}{city}・{country}` e.g. `埼玉県朝霞市・日本` */
export function formatRegion(
  state: string | null | undefined,
  city: string | null | undefined,
  country: string | null | undefined,
): string {
  const place = `${state ?? ""}${city ?? ""}`;
  const parts = [place, country ?? ""].filter(Boolean);
  return parts.join("・");
}
