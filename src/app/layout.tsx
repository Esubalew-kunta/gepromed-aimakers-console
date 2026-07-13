import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gepromed AI Console",
  description:
    "Gepromed AI Console, an AI Makers demo. AI skills, automations and enablement for medical-device teams.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1f63e0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. Foxified/Crosspilot)
    // inject attributes onto <html>/<body> before React hydrates, which would
    // otherwise trigger a hydration-attribute-mismatch warning. Scoped to these
    // two elements only — it does not hide real mismatches elsewhere.
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
