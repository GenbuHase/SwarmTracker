import type { Metadata } from "next";
import { HomeClient } from "@/components/HomeClient";
import { formatLocalAbsoluteTime, formatRegion } from "@/lib/format";
import { getPresenceResult, ogImageVersion } from "@/lib/presence";

const FALLBACK_TITLE = "SwarmTracker";
const FALLBACK_DESCRIPTION = "いまどこにいるかを Swarm チェックインから表示します";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const result = await getPresenceResult();
    const version = ogImageVersion(result);
    const image = {
      url: `/api/ogp?v=${encodeURIComponent(version)}`,
      width: 1200,
      height: 630,
      alt: "SwarmTracker",
    };

    if (result.presence.visible) {
      const { venueName, state, city, country, checkedInAt, timeZoneOffset } =
        result.presence;
      const region = formatRegion(state, city, country);
      const time = formatLocalAbsoluteTime(checkedInAt, timeZoneOffset);
      const description = [region, time ? `${time}にチェックイン` : null]
        .filter(Boolean)
        .join(" · ");

      return {
        title: `${FALLBACK_TITLE} — ${venueName}`,
        description: description || FALLBACK_DESCRIPTION,
        openGraph: {
          title: `${FALLBACK_TITLE} — ${venueName}`,
          description: description || FALLBACK_DESCRIPTION,
          type: "website",
          images: [image],
        },
        twitter: {
          card: "summary_large_image",
          title: `${FALLBACK_TITLE} — ${venueName}`,
          description: description || FALLBACK_DESCRIPTION,
          images: [image.url],
        },
      };
    }

    const away = result.presence.reason === "disabled";
    const title = FALLBACK_TITLE;
    const description = away
      ? "現在公開されていません"
      : "公開記録がありません";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: [image],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image.url],
      },
    };
  } catch {
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      openGraph: {
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        type: "website",
        images: [{ url: "/api/ogp?v=error", width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        images: ["/api/ogp?v=error"],
      },
    };
  }
}

export default function HomePage() {
  return <HomeClient />;
}
