import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SKYNETx — Cognitive Runtime for Autonomous Agents",
  description: "Runtime monitoring API for autonomous agents. Drift detection, context pressure, verbosity suppression, and session half-life estimation. Deterministic, sub-2ms, framework-agnostic.",
  metadataBase: new URL("https://skynetx.io"),
  icons: {
    icon: "/skynet-desktop-icon.svg",
    shortcut: "/skynet-desktop-icon.svg",
    apple: "/skynet-desktop-icon.svg",
  },
  openGraph: {
    title: "SKYNETx — Cognitive Runtime for Autonomous Agents",
    description: "Runtime monitoring API for autonomous agents. Drift detection, context pressure, verbosity suppression, session half-life. 100 free credits.",
    url: "https://skynetx.io",
    siteName: "SKYNETx",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SKYNETx — Cognitive Runtime for Autonomous Agents",
    description: "Runtime monitoring API for autonomous agents. Deterministic, sub-2ms, framework-agnostic. 100 free credits.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
