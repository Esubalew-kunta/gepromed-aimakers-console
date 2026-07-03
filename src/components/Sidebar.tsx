"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/leads", label: "Lead management", icon: "users" },
  { href: "/courses", label: "Course management", icon: "book" },
  { href: "/contracts", label: "Contract templates", icon: "clipboard-check" },
  { href: "/skills", label: "Skills catalog", icon: "grid" },
  { href: "/automations", label: "Automations", icon: "bolt" },
  { href: "/lms", label: "LMS handoff", icon: "graduation-cap" },
  { href: "/integrations", label: "Integrations", icon: "plug" },
  { href: "/roadmap", label: "Roadmap", icon: "map" },
  { href: "/inputs", label: "Inputs & access", icon: "key" },
  { href: "/training", label: "Training hub", icon: "book" },
  { href: "/feedback", label: "Feedback", icon: "chat" },
];

export function Sidebar({ user }: { user: { name: string; title: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
          Menu
        </button>
      </div>

      <aside
        className={`${
          open ? "block" : "hidden"
        } border-b border-ink-100 bg-white lg:block lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r`}
      >
        <div className="hidden items-center gap-3 px-5 py-5 lg:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            G
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-ink-900">
              Gepromed AI Console
            </p>
            <p className="text-xs text-ink-400">by AI Makers</p>
          </div>
        </div>

        <nav className="space-y-0.5 px-3 py-3">
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
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pb-5 lg:absolute lg:bottom-0 lg:w-64">
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
              Sign out
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
