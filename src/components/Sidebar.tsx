"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { useT, useLang, type DictKey } from "@/lib/i18n";
import type { ConsoleBadges } from "@/lib/badges";

const COLLAPSE_KEY = "gepromed-console-sidebar-collapsed";

const NAV: { href: string; labelKey: DictKey; icon: string; badgeKey?: keyof ConsoleBadges }[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: "home" },
  { href: "/trainees", labelKey: "nav.trainees", icon: "users", badgeKey: "trainees" },
  { href: "/courses", labelKey: "nav.courses", icon: "book" },
  { href: "/engineering", labelKey: "nav.engineering", icon: "workflow", badgeKey: "engineering" },
  { href: "/contacts", labelKey: "nav.contacts", icon: "mail", badgeKey: "contacts" },
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

export function Sidebar({
  user,
  badges,
}: {
  user: { name: string; title: string };
  badges?: ConsoleBadges;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Desktop collapse (icon-rail mode, Claude/ChatGPT-style). Starts expanded
  // on every load (matches server render) and restores the visitor's last
  // choice from localStorage once mounted, to avoid a hydration mismatch.
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const t = useT();
  const totalBadges = badges ? Object.values(badges).reduce((a, b) => a + b, 0) : 0;

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

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
          className="btn-ghost relative px-3 py-1.5"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {t("chrome.menu")}
          {totalBadges > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
          )}
        </button>
      </div>

      <aside
        className={`${open ? "flex" : "hidden"} ${
          collapsed ? "lg:w-[4.5rem]" : "lg:w-64"
        } max-h-[80vh] flex-col border-b border-ink-100 bg-white transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:max-h-screen lg:shrink-0 lg:border-b-0 lg:border-r ${
          hydrated ? "" : "invisible lg:visible"
        }`}
      >
        <div
          className={`hidden shrink-0 flex-col gap-3 px-5 py-5 lg:flex ${
            collapsed ? "lg:items-center lg:px-0" : ""
          }`}
        >
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "min-w-0"}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
              G
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight text-ink-900">
                  Gepromed AI Console
                </p>
                <p className="truncate text-xs text-ink-400">{t("chrome.by")}</p>
              </div>
            )}
          </div>
          <div className={`flex items-center gap-1 ${collapsed ? "" : "justify-end"}`}>
            {!collapsed && <LangToggle />}
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? t("chrome.expand") : t("chrome.collapse")}
              title={collapsed ? t("chrome.expand") : t("chrome.collapse")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
            >
              <Icon
                name={collapsed ? "chevron-right" : "panel-left"}
                className="h-4 w-4"
              />
            </button>
          </div>
        </div>

        <nav
          className={`flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden py-3 ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          {NAV.map((item) => {
            const active = isActive(item.href);
            const count = item.badgeKey ? badges?.[item.badgeKey] ?? 0 : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? t(item.labelKey) : undefined}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center rounded-xl text-sm font-medium transition ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                <span className="relative shrink-0">
                  <Icon
                    name={item.icon}
                    className={`h-5 w-5 ${active ? "text-brand-600" : "text-ink-400"}`}
                  />
                  {collapsed && count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{t(item.labelKey)}</span>
                    {count > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </>
                )}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full z-20 ml-2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                    {t(item.labelKey)}
                    {count > 0 ? ` · ${count}` : ""}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={`shrink-0 pb-5 ${collapsed ? "px-2" : "px-3"}`}>
          {collapsed ? (
            <a
              href="/logout"
              title={`${user.name} · ${t("chrome.signOut")}`}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 transition hover:bg-brand-200"
            >
              {user.name.slice(0, 1).toUpperCase()}
            </a>
          ) : (
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
          )}
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
