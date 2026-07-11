"use client";

import { StackWidget } from "@/components/StackWidget";
import { usePresence } from "@/components/usePresence";

export default function HomePage() {
  const { data, state } = usePresence();

  return (
    <main className="page">
      <StackWidget data={data} state={state} />
    </main>
  );
}
