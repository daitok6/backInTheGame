"use client";

import { useState } from "react";
import { videoGroup, type VideoKey } from "@/lib/content";

export function WatchFormLink({ videoKey }: { videoKey: VideoKey }) {
  const [expanded, setExpanded] = useState(false);
  const group = videoGroup(videoKey);
  const primary = group.videos.find((v) => v.primary) ?? group.videos[0];
  const hasMultiple = group.videos.length > 1;

  if (!hasMultiple) {
    return (
      <a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-teal-deep underline decoration-teal-mist underline-offset-2 hover:text-teal"
      >
        ▶ watch form
      </a>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-xs font-medium text-teal-deep underline decoration-teal-mist underline-offset-2 hover:text-teal"
      >
        ▶ watch form {expanded ? "▲" : "▼"}
      </button>
      {expanded && (
        <ul className="flex flex-col gap-1 pl-2">
          {group.videos.map((v) => (
            <li key={v.url}>
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-teal-deep underline decoration-teal-mist underline-offset-2 hover:text-teal"
              >
                {v.title}
                {v.primary ? " (primary)" : ""}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
