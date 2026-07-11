import type { PresenceHere } from "./types";

const API_VERSION = "20260711";
const CHECKIN_LIMIT = 50;

type SwarmCheckin = {
  id?: string;
  createdAt?: number;
  timeZoneOffset?: number;
  visibility?: string;
  shout?: string | null;
  venue?: {
    name?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
      lat?: number;
      lng?: number;
    };
  };
};

type SwarmCheckinsResponse = {
  meta?: { code?: number; errorDetail?: string };
  response?: {
    checkins?: {
      items?: SwarmCheckin[];
    };
  };
};

export async function fetchLatestPublicCheckin(): Promise<PresenceHere | null> {
  const token = process.env.FOURSQUARE_OAUTH_TOKEN;
  if (!token) {
    throw new Error("FOURSQUARE_OAUTH_TOKEN is not set");
  }

  const url = new URL("https://api.foursquare.com/v2/users/self/checkins");
  url.searchParams.set("v", API_VERSION);
  url.searchParams.set("limit", String(CHECKIN_LIMIT));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = (await res.json()) as SwarmCheckinsResponse;
  const metaCode = data.meta?.code;
  if (!res.ok || (metaCode != null && metaCode !== 200)) {
    const detail =
      data.meta?.errorDetail ??
      data.meta?.errorType ??
      `Swarm API error: ${res.status}`;
    throw new Error(detail);
  }

  const items = data.response?.checkins?.items ?? [];
  const checkin = items.find((item) => item.visibility !== "private");
  if (!checkin?.id || checkin.createdAt == null) {
    return null;
  }

  const location = checkin.venue?.location;

  return {
    visible: true,
    checkinId: checkin.id,
    venueName: checkin.venue?.name ?? "不明な場所",
    city: location?.city ?? null,
    state: location?.state ?? null,
    country: location?.country ?? null,
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    checkedInAt: new Date(checkin.createdAt * 1000).toISOString(),
    timeZoneOffset: checkin.timeZoneOffset ?? 0,
    shout: checkin.shout ?? null,
  };
}
