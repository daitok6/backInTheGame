import Link from "next/link";

const CARDS = [
  { href: "/routines", icon: "📋", label: "Routines", desc: "Saved workout templates" },
  { href: "/nutrition", icon: "🍽️", label: "Nutrition", desc: "Food & macro logging" },
  { href: "/guided", icon: "🧭", label: "Guided", desc: "Step-by-step workouts" },
  { href: "/videos", icon: "🎬", label: "Videos", desc: "Exercise form reference" },
];

export default function MorePage() {
  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 p-4 pb-10">
      <h1 className="text-xl font-semibold">More</h1>
      <div className="grid grid-cols-2 gap-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex min-h-[88px] flex-col gap-1 rounded-card border border-border bg-card p-4 hover:border-teal"
          >
            <span className="text-2xl">{card.icon}</span>
            <span className="text-base font-semibold">{card.label}</span>
            <span className="text-xs text-muted">{card.desc}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
