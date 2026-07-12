import { resolveEmbedVariant } from "@/lib/embed";
import { EmbedApp } from "./EmbedApp";

type Props = {
  searchParams: Promise<{ variant?: string | string[] }>;
};

export default async function EmbedPage({ searchParams }: Props) {
  const params = await searchParams;
  const variant = resolveEmbedVariant(params.variant);

  // key forces a clean mount when variant changes (avoids soft-nav hydration mismatches).
  return <EmbedApp key={variant} variant={variant} />;
}
