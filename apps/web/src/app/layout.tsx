import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "GalaPH — Philippine Barkada Travel & Itemized Ledger OS",
  description:
    "All-in-one Philippine barkada travel operating system with dual-RFID toll calculator, commuter transit directory, itemized KKB ledger, and live convoy telemetry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
