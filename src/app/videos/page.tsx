import { VIDEO_LIBRARY } from "@/lib/content";

export const metadata = {
  title: "Exercise videos — Back in the Game",
};

export default function VideosPage() {
  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-6 p-4 pb-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Exercise video library</h1>
        <p className="text-sm text-muted">
          Form references for everything on the daily checklist, plus optional
          extras.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {VIDEO_LIBRARY.map((group) => (
          <section
            key={group.key}
            className="flex flex-col gap-3 rounded-card border border-border bg-card p-4"
          >
            <h2 className="text-base font-semibold">{group.exercise}</h2>
            {group.warning && (
              <p className="rounded-lg border border-coral bg-coral-soft p-3 text-sm text-ink">
                {group.warning}
              </p>
            )}
            <ul className="flex flex-col gap-3">
              {group.videos.map((video) => (
                <li key={video.url} className="flex flex-col gap-1">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-teal-deep underline decoration-teal-mist underline-offset-2 hover:text-teal"
                  >
                    {video.title}
                    {video.primary ? " (primary)" : ""}
                  </a>
                  <span className="text-xs text-muted">{video.source}</span>
                  <span className="text-xs text-ink">{video.why}</span>
                </li>
              ))}
            </ul>
            {group.reelUrls && group.reelUrls.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  🎬 Quick reels
                </span>
                <ul className="flex flex-col gap-1">
                  {group.reelUrls.map((url, i) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-teal-deep underline decoration-teal-mist underline-offset-2 hover:text-teal"
                      >
                        Reel {i + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
