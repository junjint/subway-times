import type { Metadata, Viewport } from "next";
import { Silkscreen, Press_Start_2P } from "next/font/google";
import "./globals.css";

// Silkscreen is a 5x7 bitmap font — perfect for the destination LED text.
// Press Start 2P is a chunky 8x8 grid font — used for the big minute counts.
const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-silkscreen",
});
const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-press-start",
});

export const metadata: Metadata = {
  title: "Subway Times — NYC MTA arrivals",
  description:
    "Live NYC subway arrival countdown board styled like a wooden LED matrix sign. Powered by official MTA GTFS-Realtime feeds.",
  applicationName: "Subway Times",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${silkscreen.variable} ${pressStart.variable}`}
    >
      <body className="min-h-screen bg-black text-white antialiased relative">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
