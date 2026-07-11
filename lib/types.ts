export type Visibility = "on" | "off";

export type Settings = {
  visibility: Visibility;
  updatedAt: string;
};

export type PresenceAway = {
  visible: false;
  reason: "disabled";
};

export type PresenceUnknown = {
  visible: false;
  reason: "no_public_checkin";
};

export type PresenceHere = {
  visible: true;
  checkinId: string;
  venueName: string;
  city: string | null;
  state: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  checkedInAt: string;
  timeZoneOffset: number;
  shout: string | null;
};

export type PresenceResponse = PresenceAway | PresenceUnknown | PresenceHere;

export type UiState = "here" | "away" | "unknown" | "loading" | "error";
