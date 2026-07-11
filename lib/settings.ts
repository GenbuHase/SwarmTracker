import type { Settings, Visibility } from "./types";
import { createRedis } from "./redis";

const SETTINGS_KEY = "presence:settings";

/** Unset settings → treat as off (safe default). */
export async function getSettings(): Promise<Settings> {
  const redis = createRedis();
  if (!redis) {
    return { visibility: "off", updatedAt: new Date(0).toISOString() };
  }

  try {
    const value = await redis.get<Settings>(SETTINGS_KEY);
    if (!value || (value.visibility !== "on" && value.visibility !== "off")) {
      return { visibility: "off", updatedAt: new Date(0).toISOString() };
    }
    return value;
  } catch {
    // Fail closed: treat as off if KV is unreachable
    return { visibility: "off", updatedAt: new Date(0).toISOString() };
  }
}

export async function setVisibility(visibility: Visibility): Promise<Settings> {
  const redis = createRedis();
  if (!redis) {
    throw new Error("KV is not configured (KV_REST_API_URL / KV_REST_API_TOKEN)");
  }

  const settings: Settings = {
    visibility,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(SETTINGS_KEY, settings);
  return settings;
}

export function isKvConfigured(): boolean {
  return createRedis() !== null;
}
