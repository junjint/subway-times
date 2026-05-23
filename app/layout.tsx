import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Subway Screen — NYC MTA arrivals",
  description:
    "Live NYC subway arrival countdown board styled like an MTA platform screen. Powered by official MTA GTFS-Realtime feeds.",
  applicationName: "Subway Screen",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mta-black text-white antialiased relative">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
