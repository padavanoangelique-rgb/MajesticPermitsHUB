import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { ThemeSync } from "@/components/layout/theme-sync";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!raw || raw.includes("vercel.app")) return "https://majesticpermits.com";
  return raw;
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Permit expediting in Miami-Dade, Broward, and Palm Beach",
    template: "%s | Majestic Permits",
  },
  description:
    "Permit expediting for windows, doors, roofing, and renovations in Miami-Dade, Broward, and Palm Beach. We prepare the package, file it, and track it through inspection.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Permit expediting in Miami-Dade, Broward, and Palm Beach",
    description:
      "Permit expediting for windows, doors, roofing, and renovations in Miami-Dade, Broward, and Palm Beach.",
    siteName: "Majestic Permits",
    type: "website",
    images: ["/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Majestic Permits",
    description:
      "Permit expediting in Miami-Dade, Broward, and Palm Beach.",
    images: ["/icons/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="majestic-color"
          disableTransitionOnChange
        >
          <ThemeSync />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
