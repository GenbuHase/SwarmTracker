"use client";

import { StackWidget } from "@/components/StackWidget";
import { usePresence } from "@/components/usePresence";

export function HomeClient() {
  const { data, state } = usePresence();

  return (
    <main className="page">
      <StackWidget data={data} state={state} />
    </main>
  );
}
