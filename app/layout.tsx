import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RareSignal — Validated synthetic ECG datasets",
  description:
    "Generate device-matched rare-event ECG datasets with clinical, statistical, privacy, and downstream model validation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
