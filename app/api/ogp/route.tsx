import { ImageResponse } from "next/og";
import { OgCard } from "@/lib/og-card";
import { loadOgFonts } from "@/lib/og-fonts";
import { getPresence } from "@/lib/presence";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 } as const;

export async function GET() {
  try {
    const [presence, fonts] = await Promise.all([getPresence(), loadOgFonts()]);

    return new ImageResponse(<OgCard presence={presence} />, {
      ...SIZE,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to render OGP";
    console.error("[ogp]", message);

    try {
      const fonts = await loadOgFonts();
      return new ImageResponse(<OgCard presence={null} errored />, {
        ...SIZE,
        fonts,
        headers: {
          "Cache-Control": "no-store",
        },
      });
    } catch (fontErr) {
      const fontMessage =
        fontErr instanceof Error ? fontErr.message : "Failed to load OGP fonts";
      console.error("[ogp]", fontMessage);
      return new Response("Failed to render OGP", { status: 500 });
    }
  }
}
