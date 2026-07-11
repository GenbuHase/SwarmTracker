import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getAdminToken,
  getClientIp,
  safeEqual,
} from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { setVisibility } from "@/lib/settings";
import type { Visibility } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Failed auth attempts per IP within the window. */
const AUTH_RATE_LIMIT = 10;
const AUTH_RATE_WINDOW_SECONDS = 15 * 60;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function tooManyAttempts() {
  return NextResponse.json(
    { error: "Too many attempts. Try again later." },
    { status: 429 },
  );
}

export async function POST(request: Request) {
  const adminToken = getAdminToken();
  if (!adminToken) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN is not configured" },
      { status: 500 },
    );
  }

  const ip = getClientIp(request);
  const provided = extractBearerToken(request.headers.get("authorization"));

  if (!provided || !safeEqual(provided, adminToken)) {
    const { ok } = await consumeRateLimit({
      key: `visibility-auth:${ip}`,
      limit: AUTH_RATE_LIMIT,
      windowSeconds: AUTH_RATE_WINDOW_SECONDS,
    });
    if (!ok) {
      return tooManyAttempts();
    }
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const visibility =
    body &&
    typeof body === "object" &&
    "visibility" in body &&
    (body as { visibility: unknown }).visibility;

  if (visibility !== "on" && visibility !== "off") {
    return NextResponse.json(
      { error: 'visibility must be "on" or "off"' },
      { status: 400 },
    );
  }

  try {
    const settings = await setVisibility(visibility as Visibility);
    return NextResponse.json({
      ok: true,
      visibility: settings.visibility,
      updatedAt: settings.updatedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update visibility";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
