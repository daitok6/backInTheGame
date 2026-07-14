export type Phase = "pre" | "flight" | "kl";

export const PHASE_LABELS: Record<Phase, string> = {
  pre: "Pre-flight",
  flight: "Flight",
  kl: "In KL",
};

// ---------------------------------------------------------------------------
// Reach levels — how far down the leg pain reaches. 0 = fully centralized.
// ---------------------------------------------------------------------------

export const REACH_LEVELS = [
  { level: 0, label: "No pain" },
  { level: 1, label: "Back only" },
  { level: 2, label: "Into butt" },
  { level: 3, label: "Down thigh" },
  { level: 4, label: "To calf" },
  { level: 5, label: "To foot" },
] as const;

export function reachLabel(level: number): string {
  return REACH_LEVELS[Math.max(0, Math.min(5, level))]?.label ?? "No pain";
}

// The leg map is drawn spine-to-foot; segment index 0 = Back (nearest centralization).
export const LEG_SEGMENTS = [
  { level: 1, label: "Back" },
  { level: 2, label: "Butt" },
  { level: 3, label: "Thigh" },
  { level: 4, label: "Calf" },
  { level: 5, label: "Foot" },
] as const;

// ---------------------------------------------------------------------------
// Exercise video library — static, linked from checklist items and /videos.
// ---------------------------------------------------------------------------

export type VideoKey =
  | "sphinx-pressups"
  | "mcgill-big3"
  | "hip-hinge"
  | "glute-bridge"
  | "nerve-flossing";

export interface VideoEntry {
  title: string;
  source: string;
  why: string;
  url: string;
  primary?: boolean;
}

export interface VideoGroup {
  key: VideoKey;
  exercise: string;
  warning?: string;
  videos: VideoEntry[];
  /** Optional quick Instagram Reel links — a faster alternative to a full
   * YouTube video. Empty until filled in (paste URLs in as you find them). */
  reelUrls?: string[];
}

export const VIDEO_LIBRARY: VideoGroup[] = [
  {
    key: "sphinx-pressups",
    exercise: "Sphinx & press-ups (McKenzie extension)",
    videos: [
      {
        title:
          "Absolute Best Exercise for Sciatica & Herniated Disc — McKenzie Approach",
        source: "Bob & Brad (physical therapists)",
        why: "Primary; clear progression from prone lying to press-ups",
        url: "https://www.youtube.com/watch?v=clfpWjqVP6U",
        primary: true,
      },
      {
        title: "BEST McKenzie Low Back Exercises for Herniated Disc",
        source: "YouTube",
        why: "Alternate walkthrough",
        url: "https://www.youtube.com/watch?v=k_rbNlMUP5E",
      },
    ],
  },
  {
    key: "mcgill-big3",
    exercise: "Bird-dog, side plank, curl-up (McGill Big 3)",
    videos: [
      {
        title: "McGill's Big 3: Curl Up, Side Plank & Bird Dogs + Dead Bugs",
        source: "YouTube",
        why: "Primary; covers all three plus dead bugs",
        url: "https://www.youtube.com/watch?v=2aGunzN5YWA",
        primary: true,
      },
      {
        title: "3 best exercises for reducing lower back pain: The McGill Big 3",
        source: "YouTube",
        why: "Alternate demonstration",
        url: "https://www.youtube.com/watch?v=FmZwkgg7pqU",
      },
      {
        title: "Core Strengthening | McGill Big 3 Exercises",
        source: "YouTube",
        why: "Alternate demonstration",
        url: "https://www.youtube.com/watch?v=S8VFbkSjCsQ",
      },
    ],
  },
  {
    key: "hip-hinge",
    exercise: "Hip hinge",
    videos: [
      {
        title: "How to Do a Hip Hinge: A Guide from Physical Therapists",
        source: "Hinge Health",
        why: "Primary; the pattern that protects the disc every time something gets picked up",
        url: "https://www.youtube.com/watch?v=2W_gXhut5S8",
        primary: true,
      },
    ],
  },
  {
    key: "glute-bridge",
    exercise: "Glute bridge",
    videos: [
      {
        title: "Glute Bridges Exercise for Hips & Butt",
        source: "Release Physical Therapy",
        why: "Primary",
        url: "https://www.youtube.com/watch?v=WtilA9IJX1c",
        primary: true,
      },
      {
        title: "Glute Bridge Exercise with Band for Hip Stability & Back Pain Relief",
        source: "YouTube",
        why: "Banded progression for later",
        url: "https://www.youtube.com/watch?v=1vgjDZ9SZr4",
      },
    ],
  },
  {
    key: "nerve-flossing",
    exercise: "Sciatic nerve flossing (optional/advanced)",
    warning:
      "Do the lying-down version, not the seated one — seated flossing is a flexed position, which is the direction that aggravates this back. Gentle only; stop if leg symptoms increase.",
    videos: [
      {
        title: "Sciatic Nerve Flossing — How and When to Perform",
        source: "YouTube",
        why: "Primary demonstration",
        url: "https://www.youtube.com/watch?v=tr88uGR5w80",
        primary: true,
      },
      {
        title: "Learn Nerve Glide Exercises to Alleviate Back Pain and Sciatica",
        source: "Pain Science PT",
        why: "Alternate demonstration",
        url: "https://www.youtube.com/watch?v=QlkdW_jsWW0",
      },
    ],
  },
];

export function videoGroup(key: VideoKey): VideoGroup {
  const group = VIDEO_LIBRARY.find((g) => g.key === key);
  if (!group) throw new Error(`Unknown video group: ${key}`);
  return group;
}

// ---------------------------------------------------------------------------
// Daily checklists — phase-dependent. Stored per-day in daily_logs.checks.
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  id: string;
  label: string;
  hint: string;
  videoKey?: VideoKey;
}

export const PRE_CHECKLIST: ChecklistItem[] = [
  {
    id: "sphinx_am",
    label: "Morning sphinx — 2 min prone on forearms",
    hint: "Wait an hour after waking before any bending",
    videoKey: "sphinx-pressups",
  },
  {
    id: "pressups",
    label: "Press-ups, 10 reps × 2 sets",
    hint: "Hips stay on floor. Stop if pain moves DOWN the leg",
    videoKey: "sphinx-pressups",
  },
  {
    id: "walk",
    label: "Walk 30+ min",
    hint: "Split into 2 walks if the leg complains",
  },
  {
    id: "nolift",
    label: "Zero heavy lifting today",
    hint: "Outsource it — the move is not a workout",
    videoKey: "hip-hinge",
  },
  {
    id: "deskbreaks",
    label: "Desk breaks every 45 min",
    hint: "Stand, extend, 10 steps. Sitting is loaded flexion",
  },
];

export const KL_CHECKLIST: ChecklistItem[] = [
  {
    id: "sphinx_am",
    label: "Morning sphinx — 2 min prone on forearms",
    hint: "Discs are pressurized at dawn. No bending first hour",
    videoKey: "sphinx-pressups",
  },
  {
    id: "pressups",
    label: "Press-ups, 10 reps × 2 sets",
    hint: "Leg pain retreating upward = green light",
    videoKey: "sphinx-pressups",
  },
  {
    id: "walk",
    label: "Walk 30+ min",
    hint: "Explore the neighborhood — upright movement is medicine",
  },
  {
    id: "pool",
    label: "Pool: 15–20 min easy laps or water walking",
    hint: "Unloaded spine + movement",
  },
  {
    id: "gym",
    label: "Gym: hip hinges, glute bridges, bird-dogs, carries",
    hint: "Skip loaded forward bends & sit-ups for now",
    videoKey: "mcgill-big3",
  },
  {
    id: "deskbreaks",
    label: "Desk breaks every 45 min",
    hint: "Lumbar roll in, slump out",
  },
];

export function checklistForPhase(phase: Phase): ChecklistItem[] {
  if (phase === "pre") return PRE_CHECKLIST;
  if (phase === "kl") return KL_CHECKLIST;
  return []; // flight day: to-dos only, no daily checklist
}

// Union of all checklist item ids across phases, for CSV export columns.
export const ALL_CHECKLIST_ITEM_IDS = Array.from(
  new Set([...PRE_CHECKLIST, ...KL_CHECKLIST].map((i) => i.id)),
);

// ---------------------------------------------------------------------------
// One-time relocation to-dos, per phase. Seeded into the `todos` table.
// ---------------------------------------------------------------------------

export interface TodoSeedItem {
  itemId: string;
  label: string;
}

export const TODOS_PRE: TodoSeedItem[] = [
  { itemId: "meds_legal", label: "Check meds are legal in Malaysia + get doctor's letter" },
  { itemId: "refill_rx", label: "Refill prescriptions" },
  { itemId: "physio_shortlist", label: "Shortlist a physio clinic in KL & book week-1 assessment" },
  { itemId: "aisle_seat", label: "Book an aisle seat" },
  { itemId: "movers", label: "Arrange movers (no solo heavy lifting)" },
  { itemId: "lumbar_roll", label: "Pack a lumbar roll in carry-on" },
];

export const TODOS_FLIGHT: TodoSeedItem[] = [
  { itemId: "aisle_walk", label: "Stand/walk the aisle every 45–60 min" },
  { itemId: "lumbar_roll_flight", label: "Lumbar roll behind low back from takeoff" },
  { itemId: "overhead_help", label: "Ask for help with overhead bins" },
  { itemId: "hydrate", label: "Hydrate, avoid deep slump when sleeping" },
  { itemId: "landing_extensions", label: "5 min of standing extensions after landing" },
];

export const TODOS_KL: TodoSeedItem[] = [
  { itemId: "physio_assessment", label: "Go to the physio assessment (bring imaging report)" },
  { itemId: "desk_setup", label: "Set up desk with lumbar support, screen at eye level" },
  { itemId: "walking_route", label: "Find a go-to walking route" },
  { itemId: "pool_session", label: "First easy pool session" },
  { itemId: "gym_layout", label: "Learn the gym layout" },
  { itemId: "register_gp", label: "Register with a local GP for prescription continuity" },
];

export const TODOS_BY_PHASE: Record<Phase, TodoSeedItem[]> = {
  pre: TODOS_PRE,
  flight: TODOS_FLIGHT,
  kl: TODOS_KL,
};

// ---------------------------------------------------------------------------
// Red flags — always-visible safety footer.
// ---------------------------------------------------------------------------

export const RED_FLAGS = [
  "numbness in the groin or inner thighs",
  "new bladder or bowel trouble",
  "leg weakness getting worse (foot dragging or giving out)",
  "pain that becomes constant and unbearable",
];

// ---------------------------------------------------------------------------
// Starter exercise library — seeded into the `exercises` table on first run
// so the workout-log picker isn't empty. Users can add their own beyond this.
// ---------------------------------------------------------------------------

export interface StarterExercise {
  name: string;
  muscleGroup: string;
}

export const STARTER_EXERCISES: StarterExercise[] = [
  { name: "Squat", muscleGroup: "legs" },
  { name: "Bench Press", muscleGroup: "push" },
  { name: "Deadlift", muscleGroup: "posterior chain" },
  { name: "Overhead Press", muscleGroup: "push" },
  { name: "Pull-up", muscleGroup: "pull" },
  { name: "Hip Hinge / RDL", muscleGroup: "posterior chain" },
  { name: "Glute Bridge", muscleGroup: "posterior chain" },
  { name: "Bird-Dog", muscleGroup: "core" },
  { name: "Plank", muscleGroup: "core" },
  { name: "Farmer's Carry", muscleGroup: "full body" },
];
