"use client";

import { CompactWidget } from "@/components/CompactWidget";
import { usePresence } from "@/components/usePresence";

export default function EmbedPage() {
  const { data, state } = usePresence();

  return (
    <main className="embed-page">
      <CompactWidget data={data} state={state} />
    </main>
  );
}
