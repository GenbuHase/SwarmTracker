import { createHash, timingSafeEqual } from "node:crypto";

export function getAdminToken(): string | null {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    return null;
  }
  return token;
}

/** Constant-time string compare via SHA-256 digests (handles unequal lengths). */
export function safeEqual(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

export function extractBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }
  const token = authorization.slice(7);
  return token.length > 0 ? token : null;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
