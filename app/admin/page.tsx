"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { CompactWidget } from "@/components/CompactWidget";
import { StackWidget } from "@/components/StackWidget";
import type { PresenceResponse, UiState, Visibility } from "@/lib/types";

const TOKEN_KEY = "swarmtracker_admin_token";

const tokenListeners = new Set<() => void>();

function subscribeToken(listener: () => void) {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

function getTokenSnapshot(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

function getTokenServerSnapshot(): string | null {
  return null;
}

function writeToken(value: string | null) {
  if (value) {
    sessionStorage.setItem(TOKEN_KEY, value);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
  tokenListeners.forEach((listener) => listener());
}

function deriveUiState(json: PresenceResponse): UiState {
  if (json.visible) return "here";
  if (json.reason === "disabled") return "away";
  return "unknown";
}

function deriveVisibility(json: PresenceResponse): Visibility {
  // presence はアプリ On/Off を直接返さないため推定する。
  // disabled → off、それ以外（here / no_public_checkin）→ on
  if (!json.visible && json.reason === "disabled") return "off";
  return "on";
}

async function fetchPresence(): Promise<PresenceResponse> {
  // On 時の presence は CDN が max-age=60 でキャッシュする。
  // 管理画面は切替直後に古い On 応答を拾わないよう bust する。
  const res = await fetch(`/api/presence?_=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("presence failed");
  return (await res.json()) as PresenceResponse;
}

export default function AdminPage() {
  const token = useSyncExternalStore(
    subscribeToken,
    getTokenSnapshot,
    getTokenServerSnapshot,
  );
  const [tokenInput, setTokenInput] = useState("");
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [presence, setPresence] = useState<PresenceResponse | null>(null);
  const [uiState, setUiState] = useState<UiState>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyPresence = useCallback(
    (json: PresenceResponse, options?: { syncVisibility?: boolean }) => {
      setPresence(json);
      setUiState(deriveUiState(json));
      if (options?.syncVisibility !== false) {
        setVisibility(deriveVisibility(json));
      }
    },
    [],
  );

  const refreshPresence = useCallback(
    async (options?: { syncVisibility?: boolean }) => {
      try {
        applyPresence(await fetchPresence(), options);
      } catch {
        setPresence(null);
        setUiState("error");
      }
    },
    [applyPresence],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const json = await fetchPresence();
        if (cancelled) return;
        applyPresence(json);
      } catch {
        if (cancelled) return;
        setPresence(null);
        setUiState("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [applyPresence]);

  function unlock() {
    const value = tokenInput.trim();
    if (!value) {
      setError("トークンを入力してください");
      return;
    }
    writeToken(value);
    setError(null);
    setMessage("ロック解除しました");
  }

  function lock() {
    writeToken(null);
    setTokenInput("");
    setMessage(null);
    setError(null);
  }

  async function setPublicVisibility(next: Visibility) {
    if (!token) {
      setError("先にトークンでロック解除してください");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/visibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ visibility: next }),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        visibility?: Visibility;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }

      // POST の結果が正。続けて presence を読むが、CDN に残った On 応答で
      // visibility を上書きしない（Off に戻れないように見える不具合の原因）。
      const confirmed = json.visibility ?? next;
      setVisibility(confirmed);
      setMessage(confirmed === "on" ? "公開を On にしました" : "公開を Off にしました");

      if (confirmed === "off") {
        setPresence({ visible: false, reason: "disabled" });
        setUiState("away");
      } else {
        await refreshPresence({ syncVisibility: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  const unlocked = Boolean(token);

  return (
    <main className="admin">
      <h1>SwarmTracker Admin</h1>

      <div className="admin-panel">
        <label>
          Admin token
          <input
            type="password"
            autoComplete="off"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ADMIN_TOKEN"
            disabled={busy}
          />
        </label>

        <div className="admin-row">
          {!unlocked ? (
            <button type="button" className="primary" onClick={unlock} disabled={busy}>
              Unlock
            </button>
          ) : (
            <button type="button" onClick={lock} disabled={busy}>
              Lock
            </button>
          )}
        </div>

        <div className="status-pill">
          <span
            className={`dot ${visibility === "on" ? "" : "away"}`}
            aria-hidden="true"
          />
          Public presence: {visibility === null ? "…" : visibility === "on" ? "ON" : "OFF"}
        </div>

        <div className="admin-row">
          <button
            type="button"
            className="primary"
            disabled={!unlocked || busy || visibility === "on"}
            onClick={() => void setPublicVisibility("on")}
          >
            ON
          </button>
          <button
            type="button"
            disabled={!unlocked || busy || visibility === "off"}
            onClick={() => void setPublicVisibility("off")}
          >
            OFF
          </button>
          <button type="button" disabled={busy} onClick={() => void refreshPresence()}>
            Refresh
          </button>
        </div>

        {message ? <p className="admin-msg">{message}</p> : null}
        {error ? <p className="admin-msg error">{error}</p> : null}

        <p className="preview-label">Preview — Stack</p>
        <StackWidget data={presence} state={uiState} />

        <p className="preview-label">Preview — Compact</p>
        <CompactWidget data={presence} state={uiState} />
      </div>
    </main>
  );
}
