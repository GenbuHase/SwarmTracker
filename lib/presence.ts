import { getSettings } from "./settings";
import { fetchLatestPublicCheckin } from "./swarm";
import type { PresenceResponse, Settings } from "./types";

export type PresenceResult = {
  presence: PresenceResponse;
  settings: Settings;
};

export async function getPresenceResult(): Promise<PresenceResult> {
  const settings = await getSettings();

  if (settings.visibility !== "on") {
    return {
      presence: { visible: false, reason: "disabled" },
      settings,
    };
  }

  const checkin = await fetchLatestPublicCheckin();

  if (!checkin) {
    return {
      presence: { visible: false, reason: "no_public_checkin" },
      settings,
    };
  }

  return { presence: checkin, settings };
}

export async function getPresence(): Promise<PresenceResponse> {
  return (await getPresenceResult()).presence;
}

/** Cache-busting token for `/api/ogp?v=…` (SNS caches by image URL). */
export function ogImageVersion(result: PresenceResult): string {
  const { presence, settings } = result;
  if (presence.visible) {
    const ms = Date.parse(presence.checkedInAt);
    const t = Number.isNaN(ms) ? "" : String(Math.floor(ms / 1000));
    return t ? `${presence.checkinId}-${t}` : presence.checkinId;
  }
  if (presence.reason === "disabled") return `off-${settings.updatedAt}`;
  return `unknown-${settings.updatedAt}`;
}
