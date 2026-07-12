import type { PresenceResponse } from "./types";
import { formatLocalAbsoluteTime, formatRegion } from "./format";

const COLORS = {
  ink: "#1c2430",
  muted: "#5c6672",
  here: "#0f7a6a",
  away: "#8b929a",
  unknown: "#c4a35a",
  panel: "rgba(255, 255, 255, 0.78)",
  line: "rgba(28, 36, 48, 0.12)",
  bgStart: "#f3f0e8",
  bgMid: "#e7eef2",
  bgEnd: "#dfe8e4",
} as const;

type CardContent = {
  eyebrow: string;
  title: string;
  sub: string | null;
  footer: string;
  dot: string;
};

function resolveCard(presence: PresenceResponse | null, errored: boolean): CardContent {
  if (errored || !presence) {
    return {
      eyebrow: "ERROR",
      title: "取得に失敗しました",
      sub: null,
      footer: "場所は表示されません",
      dot: COLORS.away,
    };
  }

  if (!presence.visible) {
    if (presence.reason === "disabled") {
      return {
        eyebrow: "OFF",
        title: "非公開",
        sub: null,
        footer: "現在公開されていません",
        dot: COLORS.away,
      };
    }
    return {
      eyebrow: "PRIVATE",
      title: "共有されていません",
      sub: null,
      footer: "公開記録がありません",
      dot: COLORS.unknown,
    };
  }

  const localTime = formatLocalAbsoluteTime(presence.checkedInAt, presence.timeZoneOffset);
  const region = formatRegion(presence.state, presence.city, presence.country);

  return {
    eyebrow: "NOW",
    title: presence.venueName,
    sub: region || null,
    footer: `${localTime}にチェックイン`,
    dot: COLORS.here,
  };
}

type Props = {
  presence: PresenceResponse | null;
  errored?: boolean;
};

/** JSX for `ImageResponse` (Satori subset — no external CSS / client components). */
export function OgCard({ presence, errored = false }: Props) {
  const card = resolveCard(presence, errored);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        backgroundImage: `linear-gradient(145deg, ${COLORS.bgStart} 0%, ${COLORS.bgMid} 55%, ${COLORS.bgEnd} 100%)`,
        fontFamily: "IBM Plex Sans JP",
        color: COLORS.ink,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 560,
          padding: "40px 44px 36px",
          borderRadius: 28,
          border: `1px solid ${COLORS.line}`,
          backgroundColor: COLORS.panel,
          boxShadow: "0 24px 60px rgba(28, 36, 48, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              backgroundColor: card.dot,
              boxShadow: `0 0 0 6px ${card.dot}2e`,
            }}
          />
          <div
            style={{
              fontFamily: "Space Grotesk",
              fontSize: 22,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: COLORS.muted,
            }}
          >
            {card.eyebrow}
          </div>
        </div>

        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            marginBottom: card.sub ? 8 : 0,
          }}
        >
          {card.title}
        </div>

        {card.sub ? (
          <div style={{ fontSize: 28, color: COLORS.muted, lineHeight: 1.35 }}>
            {card.sub}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: `1px solid ${COLORS.line}`,
            fontSize: 24,
            color: COLORS.muted,
          }}
        >
          {card.footer}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 36,
          right: 48,
          fontFamily: "Space Grotesk",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: COLORS.muted,
        }}
      >
        SwarmTracker
      </div>
    </div>
  );
}
