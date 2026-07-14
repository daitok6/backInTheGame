"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Workouts" },
  { href: "/routines", label: "Routines" },
  { href: "/analytics", label: "Analytics" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/guided", label: "Guided" },
  { href: "/recovery", label: "Recovery" },
  { href: "/history", label: "History" },
  { href: "/videos", label: "Videos" },
];

export function NavBar() {
  const pathname = usePathname();

  if (pathname === "/gate") return null;

  return (
    <nav className="mx-auto flex w-full max-w-[680px] gap-1 overflow-x-auto px-4 pt-3">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active ? "bg-teal-mist text-teal-deep" : "text-muted hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
