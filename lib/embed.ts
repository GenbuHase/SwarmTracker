export type EmbedVariant = "compact" | "stack";

/** `/embed?variant=` — default stack. */
export function resolveEmbedVariant(raw: string | string[] | undefined): EmbedVariant {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "compact" ? "compact" : "stack";
}
