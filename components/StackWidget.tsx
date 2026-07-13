"use client";

import { formatLocalAbsoluteTime, formatRegion } from "@/lib/format";
import { buildSharePageUrl, buildTwitterShareUrl } from "@/lib/share";
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

function dotClass(ui: UiState): string {
  if (ui === "here") return "dot";
  if (ui === "unknown") return "dot unknown";
  return "dot away";
}

function Eyebrow({ ui, label }: { ui: UiState; label: string }) {
  return (
    <div className="stack-eyebrow">
      <span className={dotClass(ui)} aria-hidden="true" />
      <span className="eyebrow">{label}</span>
    </div>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 0 0 2.048-2.578 9.3 9.3 0 0 1-2.958 1.13 4.66 4.66 0 0 0-7.938 4.25 13.23 13.23 0 0 1-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 0 0 3.96 9.05a4.64 4.64 0 0 1-2.11-.583v.06a4.66 4.66 0 0 0 3.737 4.568 4.7 4.7 0 0 1-2.104.08 4.66 4.66 0 0 0 4.352 3.234 9.35 9.35 0 0 1-5.786 1.995c-.376 0-.747-.022-1.112-.065a13.2 13.2 0 0 0 7.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.47 9.47 0 0 0 2.323-2.41z"
      />
    </svg>
  );
}

export function StackWidget({ data, state }: Props) {
  const ui = resolveState(data, state);

  if (ui === "loading") {
    return (
      <div className="widget-stack is-enter" aria-busy="true" aria-live="polite">
        <Eyebrow ui={ui} label="…" />
        <p className="stack-title">読み込み中</p>
        <div className="stack-time">場所は表示されません</div>
      </div>
    );
  }

  if (ui === "error") {
    return (
      <div className="widget-stack" aria-live="polite">
        <Eyebrow ui={ui} label="ERROR" />
        <p className="stack-title">取得に失敗しました</p>
        <div className="stack-time">場所は表示されません</div>
      </div>
    );
  }

  if (ui === "away") {
    return (
      <div className="widget-stack" aria-live="polite">
        <Eyebrow ui={ui} label="OFF" />
        <p className="stack-title">非公開</p>
        <div className="stack-time">現在公開されていません</div>
      </div>
    );
  }

  if (ui === "unknown") {
    return (
      <div className="widget-stack" aria-live="polite">
        <Eyebrow ui={ui} label="PRIVATE" />
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
  const shareUrl = buildSharePageUrl(data.checkedInAt);
  const twitterHref = buildTwitterShareUrl(shareUrl, `I'm at ${data.venueName}`);

  return (
    <div className="widget-stack" aria-live="polite">
      <div className="stack-header">
        <Eyebrow ui={ui} label="NOW" />
        <a
          className="stack-share-btn"
          href={twitterHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Twitterでシェア"
          title="Twitterでシェア"
        >
          <TwitterIcon />
        </a>
      </div>
      <p className="stack-title">{data.venueName}</p>
      {region ? <p className="stack-sub">{region}</p> : null}
      <div className="stack-time">{localTime}にチェックイン</div>
    </div>
  );
}
