import type { Metadata } from "next";
import { Inter, Permanent_Marker, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { clubName } from "@/lib/site-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: "400"
});

export const metadata: Metadata = {
  title: `${clubName} | Events`,
  description:
    "A public events, gallery, about, and contact website for a student creative club."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${permanentMarker.variable}`}
      >
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
