import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Gepromed AI Console",
  description:
    "Gepromed AI Console, an AI Makers demo. AI skills, automations and enablement for medical-device teams.",
  robots: { index: false, follow: false },
  // Browser auto-translate (Chrome/Google Translate) is ALLOWED: the app's own
  // FR/EN toggle doesn't yet cover every section, so during client demos we rely
  // on the browser to translate the rest. See the guard script below — Translate
  // wraps text nodes in <font> tags React doesn't track, which would otherwise
  // cause removeChild/insertBefore crashes on dynamic lists; the guard neutralises
  // exactly those two operations when the node's parent was rewritten.
};

export const viewport: Viewport = {
  themeColor: "#1f63e0",
  width: "device-width",
  initialScale: 1,
};

// Makes React resilient to Google Translate's DOM rewrites. Translate replaces
// text nodes with <font>-wrapped nodes; on the next reconciliation React calls
// removeChild/insertBefore against a parent that no longer owns the node and
// throws "node to be removed is not a child of this node". We guard both calls:
// if the parent doesn't match, no-op instead of throwing. Runs beforeInteractive
// so the prototypes are patched before React hydrates.
const TRANSLATE_GUARD = `(function(){
  if (typeof Node !== 'function' || !Node.prototype) return;
  var rc = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child){
    if (child && child.parentNode !== this) { return child; }
    return rc.apply(this, arguments);
  };
  var ib = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, referenceNode){
    if (referenceNode && referenceNode.parentNode !== this) { return newNode; }
    return ib.apply(this, arguments);
  };
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // lang="fr" so browsers detect French and offer "Translate to English".
    // suppressHydrationWarning: browser extensions inject attributes on
    // <html>/<body> before hydration; scoped here only, doesn't hide real
    // mismatches elsewhere.
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="react-translate-guard" strategy="beforeInteractive">
          {TRANSLATE_GUARD}
        </Script>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
