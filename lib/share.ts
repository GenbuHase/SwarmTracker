import { getSiteUrl } from "./site";

/** Unix seconds from ISO check-in time (OGP / SNS cache-bust token). */
export function checkinCacheToken(checkedInAt: string): string {
  const ms = Date.parse(checkedInAt);
  if (Number.isNaN(ms)) return "";
  return String(Math.floor(ms / 1000));
}

/** Public page URL with `?t=` so SNS treats each check-in as a distinct crawl. */
export function buildSharePageUrl(checkedInAt: string, origin = getSiteUrl()): string {
  const base = origin.replace(/\/$/, "");
  const t = checkinCacheToken(checkedInAt);
  return t ? `${base}/?t=${t}` : `${base}/`;
}

export function buildTwitterShareUrl(pageUrl: string, text: string): string {
  const params = new URLSearchParams({ text, url: pageUrl });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
