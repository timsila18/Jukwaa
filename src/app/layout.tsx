import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jukwaakenya.co.ke"),
  title: {
    default: "JUKWAA Kenya | Campaign Management Platform",
    template: "%s | JUKWAA Kenya",
  },
  description: "JUKWAA Kenya is a secure campaign command platform for Kenyan candidates, teams, supporters, polling agents, events, voter pulse, SMS outreach, reports, and AI strategy.",
  applicationName: "JUKWAA Kenya",
  authors: [{ name: "JUKWAA Kenya" }],
  creator: "JUKWAA Kenya",
  publisher: "JUKWAA Kenya",
  keywords: [
    "JUKWAA Kenya",
    "Jukwaa",
    "Kenya campaign management platform",
    "political campaign software Kenya",
    "campaign command centre",
    "candidate management Kenya",
    "polling agent management",
    "supporter CRM Kenya",
    "campaign SMS Kenya",
  ],
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    url: "https://jukwaakenya.co.ke",
    siteName: "JUKWAA Kenya",
    title: "JUKWAA Kenya | Where Leadership Meets the People",
    description: "Secure campaign management for Kenyan candidates, campaign teams, polling agents, voter pulse, SMS outreach, reports, and AI strategy.",
    images: [
      {
        url: "/jukwaa-logo.png",
        width: 1600,
        height: 900,
        alt: "JUKWAA Kenya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JUKWAA Kenya | Campaign Management Platform",
    description: "Where leadership meets the people. A secure campaign command platform for Kenyan candidates and teams.",
    images: ["/jukwaa-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    (() => {
      try {
        const saved = localStorage.getItem("jukwaa-theme");
        const mode = saved === "dark" || saved === "light" ? saved : "light";
        document.documentElement.classList.toggle("dark", mode === "dark");
        document.documentElement.dataset.theme = mode;
      } catch {}
    })();
  `;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
