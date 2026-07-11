"use client";

import { formatLocalAbsoluteTime, formatRegion } from "@/lib/format";
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

export function StackWidget({ data, state }: Props) {
  const ui = resolveState(data, state);

  if (ui === "loading") {
    return (
      <div className="widget-stack is-enter" aria-busy="true" aria-live="polite">
        <div className="eyebrow">…</div>
        <p className="stack-title">読み込み中</p>
        <div className="stack-time">場所は表示されません</div>
      </div>
    );
  }

  if (ui === "error") {
    return (
      <div className="widget-stack" aria-live="polite">
        <div className="eyebrow">ERROR</div>
        <p className="stack-title">取得に失敗しました</p>
        <div className="stack-time">場所は表示されません</div>
      </div>
    );
  }

  if (ui === "away") {
    return (
      <div className="widget-stack" aria-live="polite">
        <div className="eyebrow">OFF</div>
        <p className="stack-title">非公開</p>
        <div className="stack-time">現在公開されていません</div>
      </div>
    );
  }

  if (ui === "unknown") {
    return (
      <div className="widget-stack" aria-live="polite">
        <div className="eyebrow">PRIVATE</div>
        <p className="stack-title">共有されていません</p>
        <div className="stack-time">公開記録がありません</div>
      </div>
    );
  }

  if (!data || !data.visible) {
    return null;
  }

  const localTime = formatLocalAbsoluteTime(data.checkedInAt, data.timeZoneOffset);
  const region = formatRegion(data.state, data.city, data.country);

  return (
    <div className="widget-stack" aria-live="polite">
      <div className="eyebrow">NOW</div>
      <p className="stack-title">{data.venueName}</p>
      {region ? <p className="stack-sub">{region}</p> : null}
      <div className="stack-time">{localTime}にチェックイン</div>
    </div>
  );
}
