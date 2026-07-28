import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${protocol}://${host}` : "https://raresignal-ecg-demo.koolcidz174.chatgpt.site";
  const imageUrl = new URL("/og.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: "RareSignal — Validated synthetic ECG datasets",
    description:
      "Generate device-matched rare-event ECG datasets with clinical, statistical, privacy, and downstream model validation.",
    openGraph: {
      title: "RareSignal — Validated synthetic ECG datasets",
      description: "Configure, generate, and validate device-matched rare-event ECG datasets.",
      images: [{ url: imageUrl, width: 1746, height: 909, alt: "RareSignal validated synthetic ECG datasets" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "RareSignal — Validated synthetic ECG datasets",
      description: "Configure, generate, and validate device-matched rare-event ECG datasets.",
      images: [imageUrl],
    },
  };
}

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
