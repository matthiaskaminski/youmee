"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import StatusBadge from "./StatusBadge";
import type { Post } from "@/types/post";

function SortablePost({
  post,
  onClick,
}: {
  post: Post;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        onClick={onClick}
        className="bg-beige-2 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-ym-blue-2 transition relative group"
        style={{ aspectRatio: "4 / 5" }}
      >
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-beige-2 flex items-center justify-center">
            <span className="text-ym-text-2 text-xs text-center px-2">
              {post.title}
            </span>
          </div>
        )}
        {/* Carousel / video indicator */}
        {post.media && post.media.length > 1 && (
          <div className="absolute top-2 right-2 bg-ym-text/60 text-beige text-[11px] px-2 py-0.5 rounded">
            {post.media.length}
          </div>
        )}
        {post.media?.some((m) => m.type === "video") && (
          <div className="absolute top-2 left-2 text-base">▶</div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-end opacity-0 group-hover:opacity-100">
          <div className="p-3 w-full">
            <p className="text-white text-sm font-medium truncate">
              {post.title}
            </p>
            <div className="flex items-center justify-between mt-1.5">
              <StatusBadge status={post.status} />
              {post.comments.length > 0 && (
                <span className="text-white text-xs">
                  💬 {post.comments.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeedPreview({
  posts,
  onPostClick,
  onReorder,
}: {
  posts: Post[];
  onPostClick: (post: Post) => void;
  onReorder: (posts: { id: string; order: number }[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const sortedPosts = [...posts]
    .filter((p) => p.imageUrl)
    .sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedPosts.findIndex((p) => p.id === active.id);
    const newIndex = sortedPosts.findIndex((p) => p.id === over.id);

    const newPosts = [...sortedPosts];
    const [moved] = newPosts.splice(oldIndex, 1);
    newPosts.splice(newIndex, 0, moved);

    const updates = newPosts.map((p, i) => ({ id: p.id, order: i }));
    onReorder(updates);
  };

  return (
    <div>
      {/* Instagram-style profile header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-ym-blue-2 flex items-center justify-center text-white font-bold text-2xl shrink-0">
            Y
          </div>
          <div>
            <p className="font-bold text-base">youmee.pl</p>
            <p className="text-sm text-ym-text-2">
              Kubeczki dla dzieci | youmee.pl
            </p>
            <div className="flex gap-4 mt-2 text-sm">
              <span><strong>{sortedPosts.length}</strong> postów</span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-beige-3 mb-1" />
        <div className="flex justify-center gap-8 py-2 text-xs text-ym-text-2 uppercase tracking-wider">
          <span className="border-t-2 border-ym-text pt-2 text-ym-text font-semibold">Posty</span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedPosts.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 gap-1 max-w-2xl mx-auto">
            {sortedPosts.map((post) => (
              <SortablePost
                key={post.id}
                post={post}
                onClick={() => onPostClick(post)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sortedPosts.length === 0 && (
        <p className="text-center text-ym-text-2 text-sm mt-8">
          Dodaj posty ze zdjęciami, aby zobaczyć podgląd feedu
        </p>
      )}

      <p className="text-center text-xs text-ym-text-2 mt-4">
        Przeciągnij kafelki, aby zmienić kolejność w feedzie
      </p>
    </div>
  );
}
