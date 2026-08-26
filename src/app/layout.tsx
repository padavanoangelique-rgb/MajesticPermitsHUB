import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Majestic Permits | We handle your permits. You build.",
  description:
    "White-glove permitting service for contractors and homeowners across South Florida. From application to final inspection — we make it painless.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://majestic-permits-hub.vercel.app"
  ),
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
    title: "Majestic Permits | We handle your permits. You build.",
    description:
      "White-glove permitting service for contractors and homeowners across South Florida. From application to final inspection — we make it painless.",
    siteName: "Majestic Permits",
    type: "website",
    images: ["/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Majestic Permits",
    description:
      "White-glove permitting for South Florida contractors and homeowners.",
    images: ["/icons/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
