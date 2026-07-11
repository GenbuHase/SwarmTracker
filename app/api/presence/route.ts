import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { fetchLatestPublicCheckin } from "@/lib/swarm";
import type { PresenceResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();

    if (settings.visibility !== "on") {
      const body: PresenceResponse = { visible: false, reason: "disabled" };
      return NextResponse.json(body, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const checkin = await fetchLatestPublicCheckin();

    if (!checkin) {
      const body: PresenceResponse = {
        visible: false,
        reason: "no_public_checkin",
      };
      return NextResponse.json(body, {
        headers: { "Cache-Control": "public, max-age=60" },
      });
    }

    return NextResponse.json(checkin satisfies PresenceResponse, {
      headers: { "Cache-Control": "public, max-age=60" },
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
