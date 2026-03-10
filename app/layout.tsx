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
  title: "SKYNETx — AI Infrastructure & Skills Marketplace",
  description: "AI infrastructure platform with memory API, skills marketplace, subscriptions, and crypto payments. Download OpenClaudeCode — control Claude Code from Telegram.",
  metadataBase: new URL("https://skynetx.io"),
  icons: {
    icon: "/skynet-desktop-icon.svg",
    shortcut: "/skynet-desktop-icon.svg",
    apple: "/skynet-desktop-icon.svg",
  },
  openGraph: {
    title: "SKYNETx — AI Infrastructure & Skills Marketplace",
    description: "Download OpenClaudeCode — control Claude Code from Telegram. Memory API, subscriptions, crypto payments. $5 one-time.",
    url: "https://skynetx.io",
    siteName: "SKYNETx",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SKYNETx — AI Infrastructure & Skills Marketplace",
    description: "Download OpenClaudeCode — control Claude Code from Telegram. $5 one-time.",
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
