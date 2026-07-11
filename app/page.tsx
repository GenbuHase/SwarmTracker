"use client";

import { StackWidget } from "@/components/StackWidget";
import { usePresence } from "@/components/usePresence";

export default function HomePage() {
  const { data, state } = usePresence();

  return (
    <main className="page">
      <h1 className="brand">SwarmTracker</h1>
      <p className="brand-sub">Swarm の最新チェックインから、いまどこにいるかを表示します。</p>
      <StackWidget data={data} state={state} />
    </main>
  );
}
