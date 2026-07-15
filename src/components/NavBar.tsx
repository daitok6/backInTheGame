"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PRIMARY = [
  { href: "/", label: "Workouts", icon: "🏋️" },
  { href: "/recovery", label: "Recovery", icon: "🩹" },
  { href: "/history", label: "History", icon: "🕘" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
];

// Destinations that live behind the "More" tab — used to keep that tab
// visually active while browsing any of them.
const SECONDARY_HREFS = ["/routines", "/nutrition", "/guided", "/videos"];

export function NavBar() {
  const pathname = usePathname();

  if (pathname === "/gate") return null;

  const moreActive = pathname === "/more" || SECONDARY_HREFS.includes(pathname);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-[var(--bottom-nav-h)] w-full max-w-[680px] items-stretch">
        {PRIMARY.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                active ? "text-teal-deep" : "text-muted"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
        <Link
          href="/more"
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            moreActive ? "text-teal-deep" : "text-muted"
          }`}
        >
          <span className="text-xl leading-none">⋯</span>
          <span className="truncate">More</span>
        </Link>
      </div>
    </nav>
  );
}
