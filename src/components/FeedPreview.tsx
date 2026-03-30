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
        className="aspect-square bg-beige-2 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-ym-blue-2 transition relative group"
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
          <div className="absolute top-1.5 right-1.5 bg-ym-text/60 text-beige text-[10px] px-1.5 py-0.5 rounded">
            {post.media.length}
          </div>
        )}
        {post.media?.some((m) => m.type === "video") && (
          <div className="absolute top-1.5 left-1.5 text-sm">▶</div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-end opacity-0 group-hover:opacity-100">
          <div className="p-2 w-full">
            <p className="text-white text-xs font-medium truncate">
              {post.title}
            </p>
            <div className="flex items-center justify-between mt-1">
              <StatusBadge status={post.status} />
              {post.comments.length > 0 && (
                <span className="text-white text-[10px]">
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
      <div className="text-center mb-6">
        <div className="inline-block">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-ym-blue-2 flex items-center justify-center text-white font-bold text-lg">
              Y
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">youmee.pl</p>
              <p className="text-xs text-ym-text-2">
                Kubeczki dla dzieci | youmee.pl
              </p>
            </div>
          </div>
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
          <div className="grid grid-cols-3 gap-1 max-w-lg mx-auto">
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
