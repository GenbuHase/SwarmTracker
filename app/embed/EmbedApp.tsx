"use client";

import { useEffect, useRef, useState } from "react";
import { CompactWidget } from "@/components/CompactWidget";
import { StackWidget } from "@/components/StackWidget";
import { usePresence } from "@/components/usePresence";
import type { EmbedVariant } from "@/lib/embed";

export const EMBED_RESIZE_MESSAGE = "swarmtracker:resize" as const;

type Props = {
  variant: EmbedVariant;
};

function Shell({ variant }: Props) {
  return (
    <main className={`embed-page embed-page--${variant}`}>
      <div className="embed-root" data-variant={variant} aria-busy="true" />
    </main>
  );
}

function Live({ variant }: Props) {
  const { data, state } = usePresence();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const publish = () => {
      const widget = el.querySelector(".widget-compact, .widget-stack");
      const target = widget instanceof HTMLElement ? widget : el;
      const width = Math.ceil(target.offsetWidth);
      const height = Math.ceil(target.offsetHeight);
      if (width <= 0 || height <= 0) return;

      window.parent.postMessage(
        { source: EMBED_RESIZE_MESSAGE, variant, width, height },
        "*",
      );
    };

    const schedule = () => {
      requestAnimationFrame(() => requestAnimationFrame(publish));
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => ro.disconnect();
  }, [variant, data, state]);

  return (
    <main className={`embed-page embed-page--${variant}`}>
      <div ref={rootRef} className="embed-root" data-variant={variant}>
        {variant === "stack" ? (
          <StackWidget data={data} state={state} />
        ) : (
          <CompactWidget data={data} state={state} />
        )}
      </div>
    </main>
  );
}

/** Client island: SSR and the first client paint render the same empty shell. */
export function EmbedApp({ variant }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Shell variant={variant} />;
  }

  return <Live variant={variant} />;
}
