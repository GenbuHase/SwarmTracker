import { NextResponse } from "next/server";
import { getPresence } from "@/lib/presence";
import type { PresenceResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const body = await getPresence();

    const cacheControl =
      body.visible === false && body.reason === "disabled"
        ? "no-store"
        : "public, max-age=60";

    return NextResponse.json(body satisfies PresenceResponse, {
      headers: { "Cache-Control": cacheControl },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load presence";
    console.error("[presence]", message);
    return NextResponse.json(
      { error: "Failed to load presence" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
