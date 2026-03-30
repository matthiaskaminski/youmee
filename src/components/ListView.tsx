"use client";

import StatusBadge from "./StatusBadge";
import type { Post } from "@/types/post";

export default function ListView({
  posts,
  onPostClick,
}: {
  posts: Post[];
  onPostClick: (post: Post) => void;
}) {
  const sorted = [...posts].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="space-y-2">
      {sorted.map((post) => (
        <button
          key={post.id}
          onClick={() => onPostClick(post)}
          className="w-full text-left bg-beige-2 rounded-xl p-4 border border-beige-2 hover:border-ym-blue-2 transition flex items-center gap-4"
        >
          {post.imageUrl ? (
            <div className="relative w-16 h-16 shrink-0">
              <img
                src={post.imageUrl}
                alt=""
                className="w-16 h-16 object-cover rounded-lg"
              />
              {post.media && post.media.length > 1 && (
                <span className="absolute top-0.5 right-0.5 bg-ym-text/60 text-beige text-[8px] px-1 rounded">
                  {post.media.length}
                </span>
              )}
              {post.media?.some((m) => m.type === "video") && (
                <span className="absolute bottom-0.5 left-0.5 text-xs">▶</span>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 bg-beige rounded-lg shrink-0 flex items-center justify-center">
              <span className="text-ym-text-2 text-xs">Brak</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{post.title}</p>
            {post.description && (
              <p className="text-xs text-ym-text-2 truncate mt-0.5">
                {post.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={post.status} />
              <span className="text-xs text-ym-text-2 capitalize">
                {post.platform}
              </span>
              {post.comments.length > 0 && (
                <span className="text-xs text-ym-text-2">
                  💬 {post.comments.length}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            {post.date ? (
              <span className="text-xs text-ym-text-2">
                {new Date(post.date).toLocaleDateString("pl-PL", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            ) : (
              <span className="text-xs text-ym-text-2 italic">Brak daty</span>
            )}
          </div>
        </button>
      ))}
      {sorted.length === 0 && (
        <p className="text-center text-ym-text-2 text-sm py-8">
          Brak postów. Dodaj pierwszy post!
        </p>
      )}
    </div>
  );
}
