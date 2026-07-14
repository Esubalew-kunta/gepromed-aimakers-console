import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Gepromed AI Console",
  description:
    "Gepromed AI Console, an AI Makers demo. AI skills, automations and enablement for medical-device teams.",
  robots: { index: false, follow: false },
  // Disable Chrome/Google auto-translate. The UI is French; when a browser
  // translates it, Translate wraps text nodes in <font> tags React doesn't
  // know about, so React's later removeChild/insertBefore targets a node whose
  // real parent is the injected <font> -> "node to be removed is not a child
  // of this node" crashes on any dynamic list (expenses review, skills, etc.).
  other: { google: "notranslate" },
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
    <html lang="fr" translate="no" className="notranslate" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
