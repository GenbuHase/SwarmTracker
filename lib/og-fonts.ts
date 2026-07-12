const FONT_CDN = "https://cdn.jsdelivr.net/fontsource/fonts";

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load font: ${url} (${res.status})`);
  }
  return res.arrayBuffer();
}

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600;
  style: "normal";
};

/** Fonts for `ImageResponse` (Satori needs woff/ttf; next/font is unavailable). */
export async function loadOgFonts(): Promise<OgFont[]> {
  const [jp400, jp600, display500, display600] = await Promise.all([
    loadFont(`${FONT_CDN}/ibm-plex-sans-jp@5.2.5/japanese-400-normal.woff`),
    loadFont(`${FONT_CDN}/ibm-plex-sans-jp@5.2.5/japanese-600-normal.woff`),
    loadFont(`${FONT_CDN}/space-grotesk@5.2.5/latin-500-normal.woff`),
    loadFont(`${FONT_CDN}/space-grotesk@5.2.5/latin-600-normal.woff`),
  ]);

  return [
    { name: "IBM Plex Sans JP", data: jp400, weight: 400, style: "normal" },
    { name: "IBM Plex Sans JP", data: jp600, weight: 600, style: "normal" },
    { name: "Space Grotesk", data: display500, weight: 500, style: "normal" },
    { name: "Space Grotesk", data: display600, weight: 600, style: "normal" },
  ];
}
