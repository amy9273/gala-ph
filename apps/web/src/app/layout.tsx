import type { Metadata, Viewport } from "next";
import React from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/providers/theme-provider";
import { QueryProvider } from "../components/providers/query-provider";
import { Navbar } from "../components/navigation/navbar";
import { Footer } from "../components/navigation/footer";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GalaPH — Philippine Barkada Travel & Itemized Ledger OS",
  description:
    "All-in-one Philippine travel operating system solving the dual-RFID toll nightmare (Autosweep vs Easytrip), last-mile commuter transit tariffs, transparent itemized KKB bill splits, and real-time GPS convoy telemetry.",
  keywords: [
    "Philippine travel",
    "barkada road trip",
    "Autosweep",
    "Easytrip",
    "Toll calculator",
    "KKB bill splitter",
    "TODA tariff",
    "PAGASA weather alerts",
  ],
  authors: [{ name: "GalaPH Engineering Team" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#090D16" },
  ],
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
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${inter.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-brand-ocean/20 selection:text-brand-ocean flex flex-col justify-between">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
