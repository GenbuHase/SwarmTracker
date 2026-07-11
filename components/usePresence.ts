"use client";

import { useEffect, useState } from "react";
import type { PresenceResponse, UiState } from "@/lib/types";

export function usePresence() {
  const [data, setData] = useState<PresenceResponse | null>(null);
  const [state, setState] = useState<UiState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      try {
        const res = await fetch("/api/presence", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("presence fetch failed");
        }
        const json = (await res.json()) as PresenceResponse;
        if (cancelled) return;
        setData(json);
        if (json.visible) {
          setState("here");
        } else if (json.reason === "disabled") {
          setState("away");
        } else {
          setState("unknown");
        }
      } catch {
        if (cancelled) return;
        setData(null);
        setState("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, state, setData, setState };
}
