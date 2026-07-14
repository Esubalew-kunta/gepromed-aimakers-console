"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import { useT, useLang, type DictKey } from "@/lib/i18n";

const NAV: { href: string; labelKey: DictKey; icon: string }[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: "home" },
  { href: "/trainees", labelKey: "nav.trainees", icon: "users" },
  { href: "/courses", labelKey: "nav.courses", icon: "book" },
  { href: "/engineering", labelKey: "nav.engineering", icon: "workflow" },
  { href: "/contracts", labelKey: "nav.contracts", icon: "clipboard-check" },
  { href: "/skills", labelKey: "nav.skills", icon: "grid" },
  { href: "/automations", labelKey: "nav.automations", icon: "bolt" },
  { href: "/expenses", labelKey: "nav.expenses", icon: "clipboard-check" },
  { href: "/integrations", labelKey: "nav.integrations", icon: "plug" },
  { href: "/roadmap", labelKey: "nav.roadmap", icon: "map" },
  { href: "/inputs", labelKey: "nav.inputs", icon: "key" },
  { href: "/training", labelKey: "nav.training", icon: "book" },
  { href: "/feedback", labelKey: "nav.feedback", icon: "chat" },
];

export function Sidebar({ user }: { user: { name: string; title: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useT();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            G
          </div>
          <span className="font-bold text-ink-900">Gepromed AI</span>
        </div>
        <button
          className="btn-ghost px-3 py-1.5"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {t("chrome.menu")}
        </button>
      </div>

      <aside
        className={`${
          open ? "flex" : "hidden"
        } max-h-[80vh] flex-col border-b border-ink-100 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:max-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r`}
      >
        <div className="hidden shrink-0 items-center justify-between gap-3 px-5 py-5 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
              G
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-ink-900">
                Gepromed AI Console
              </p>
              <p className="text-xs text-ink-400">{t("chrome.by")}</p>
            </div>
          </div>
          <LangToggle />
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`h-5 w-5 ${active ? "text-brand-600" : "text-ink-400"}`}
                />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 px-3 pb-5">
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-3">
            <p className="truncate text-sm font-semibold text-ink-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-ink-400">{user.title}</p>
            <a
              href="/logout"
              className="mt-2 flex items-center gap-2 text-xs font-medium text-ink-500 hover:text-brand-600"
            >
              <Icon name="logout" className="h-4 w-4" />
              {t("chrome.signOut")}
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex items-center rounded-full border border-ink-200 p-0.5 font-mono text-[11px] font-semibold">
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-2 py-0.5 uppercase transition ${
            lang === l ? "bg-brand-600 text-white" : "text-ink-400 hover:text-ink-700"
          }`}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
