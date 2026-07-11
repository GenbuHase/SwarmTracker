"use client";

import { formatLocalAbsoluteTime } from "@/lib/format";
import type { PresenceResponse, UiState } from "@/lib/types";

type Props = {
  data: PresenceResponse | null;
  state: UiState;
};

function resolveState(data: PresenceResponse | null, state: UiState): UiState {
  if (state === "loading" || state === "error") return state;
  if (!data) return "error";
  if (data.visible) return "here";
  if (data.reason === "disabled") return "away";
  return "unknown";
}

export function CompactWidget({ data, state }: Props) {
  const ui = resolveState(data, state);

  if (ui === "loading") {
    return (
      <div className="widget-compact is-enter" aria-busy="true" aria-live="polite">
        <span className="dot away" aria-hidden="true" />
        <span className="venue">…</span>
        <span className="meta">—</span>
      </div>
    );
  }

  if (ui === "error") {
    return (
      <div className="widget-compact" aria-live="polite">
        <span className="dot away" aria-hidden="true" />
        <span className="venue">取得失敗</span>
        <span className="meta">—</span>
      </div>
    );
  }

  if (ui === "away") {
    return (
      <div className="widget-compact" aria-live="polite">
        <span className="dot away" aria-hidden="true" />
        <span className="venue">非公開</span>
        <span className="meta">Off</span>
      </div>
    );
  }

  if (ui === "unknown") {
    return (
      <div className="widget-compact" aria-live="polite">
        <span className="dot unknown" aria-hidden="true" />
        <span className="venue">共有されていません</span>
        <span className="meta">—</span>
      </div>
    );
  }

  if (!data || !data.visible) {
    return null;
  }

  const localTime = formatLocalAbsoluteTime(data.checkedInAt, data.timeZoneOffset);

  return (
    <div className="widget-compact" aria-live="polite">
      <span className="dot" aria-hidden="true" />
      <span className="venue">{data.venueName}</span>
      <span className="meta">{localTime}</span>
    </div>
  );
}
