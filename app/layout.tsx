import type { Metadata } from "next";
import { IBM_Plex_Sans_JP, Space_Grotesk } from "next/font/google";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "SwarmTracker",
  description: "いまどこにいるかを Swarm チェックインから表示します",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${ibmPlex.variable} ${spaceGrotesk.variable}`}>
      <body className={ibmPlex.className}>{children}</body>
    </html>
  );
}
