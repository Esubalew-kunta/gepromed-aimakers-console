import type { SVGProps } from "react";

/**
 * Small dependency-free icon set (stroke-based, currentColor). Keeps the
 * bundle lean and avoids pulling an icon library into the demo.
 */
const PATHS: Record<string, React.ReactNode> = {
  "shield-check": (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  activity: <path d="M3 12h4l2 7 4-14 2 7h4" />,
  "clipboard-check": (
    <>
      <rect x="8" y="4" width="8" height="4" rx="1" />
      <path d="M8 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
      <path d="M9 14l2 2 4-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3L12 3z" />
      <path d="M18 14l.8 2 2 .8-2 .8L18 20l-.8-2-2-.8 2-.8.8-2z" />
    </>
  ),
  "alert-triangle": (
    <>
      <path d="M12 4l9 16H3l9-16z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  "message-square": <path d="M4 5h16v11H8l-4 4V5z" />,
  "list-checks": (
    <>
      <path d="M4 6l1.5 1.5L8 5" />
      <path d="M4 13l1.5 1.5L8 12" />
      <path d="M11 6h9" />
      <path d="M11 13h9" />
      <path d="M11 20h9" />
      <path d="M4 20l1.5 1.5L8 19" />
    </>
  ),
  "graduation-cap": (
    <>
      <path d="M12 4L2 9l10 5 10-5-10-5z" />
      <path d="M6 11v4c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-4" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  workflow: (
    <>
      <rect x="3" y="4" width="6" height="6" rx="1" />
      <rect x="15" y="14" width="6" height="6" rx="1" />
      <path d="M9 7h6a3 3 0 0 1 3 3v4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5z" />
      <path d="M6 17h12" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="14" r="4" />
      <path d="M11 11l9-9" />
      <path d="M17 5l2 2" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9h12v-9" />
    </>
  ),
  bolt: <path d="M13 3L5 13h5l-1 8 8-11h-5l1-7z" />,
  map: (
    <>
      <path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v5" />
      <path d="M15 3v5" />
      <path d="M7 8h10v3a5 5 0 0 1-10 0V8z" />
      <path d="M12 16v5" />
    </>
  ),
  chat: <path d="M4 5h16v11H8l-4 4V5z" />,
  logout: (
    <>
      <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
      <path d="M10 12H3" />
      <path d="M6 8l-4 4 4 4" />
    </>
  ),
  check: <path d="M5 12l4 4 10-10" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  play: <path d="M7 4l12 8-12 8V4z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
      <path d="M16 6a3 3 0 0 1 0 6" />
      <path d="M21 20c0-2.5-1.8-4.3-4-4.8" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-5 w-5",
  ...props
}: { name: string; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {PATHS[name] ?? PATHS.grid}
    </svg>
  );
}
