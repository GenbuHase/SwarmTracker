import { NextResponse } from "next/server";
import { setVisibility } from "@/lib/settings";
import type { Visibility } from "@/lib/types";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN is not configured" },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ") || auth.slice(7) !== adminToken) {
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
