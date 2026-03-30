"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import StatusBadge from "./StatusBadge";
import type { Post } from "@/types/post";

interface CalendarDay {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

function DraggablePost({
  post,
  dayPosts,
  onPostClick,
  isAdmin,
}: {
  post: Post;
  dayPosts: Post[];
  onPostClick: (post: Post) => void;
  isAdmin?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `post-${post.id}`,
    data: { post },
    disabled: !isAdmin,
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative group/post min-h-0 flex-1 ${isDragging ? "opacity-30" : ""}`}
      {...(isAdmin ? { ...attributes, ...listeners } : {})}
    >
      <button
        onClick={() => onPostClick(post)}
        className={`w-full h-full text-left ${isAdmin ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className="rounded p-0.5 hover:bg-beige/50 transition h-full flex flex-col">
          {post.imageUrl && (
            <div className="relative flex-1 min-h-0">
              <img
                src={post.imageUrl}
                alt=""
                className="w-full h-full object-cover rounded"
                style={{ minHeight: 0 }}
              />
              {post.media && post.media.length > 1 && (
                <span className="absolute top-0.5 right-0.5 bg-ym-text/60 text-beige text-[7px] px-0.5 rounded">
                  {post.media.length}
                </span>
              )}
              {post.media?.some((m) => m.type === "video") && (
                <span className="absolute top-0.5 left-0.5 text-[9px]">▶</span>
              )}
            </div>
          )}
          <p className="text-[9px] font-medium text-ym-text truncate shrink-0 mt-0.5">
            {post.title}
          </p>
          {dayPosts.length > 1 && (
            <div className="shrink-0 mt-0.5">
              <StatusBadge status={post.status} />
            </div>
          )}
        </div>
      </button>

      {/* Hover preview popup */}
      {post.imageUrl && !isDragging && (
        <div className="hidden group-hover/post:block absolute z-50 left-full top-0 ml-2 pointer-events-none">
          <div className="bg-beige rounded-xl shadow-xl border border-beige-2 p-2 w-64">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full rounded-lg"
            />
            <p className="text-xs font-medium text-ym-text mt-1.5 truncate">
              {post.title}
            </p>
            {post.description && (
              <p className="text-[10px] text-ym-text-2 mt-0.5 line-clamp-2">
                {post.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={post.status} />
              {post.media && post.media.length > 1 && (
                <span className="text-[10px] text-ym-text-2">
                  {post.media.length} slajdów
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DroppableCell({
  cd,
  isOver,
  children,
}: {
  cd: CalendarDay;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const dateStr = `${cd.year}-${String(cd.month + 1).padStart(2, "0")}-${String(cd.day).padStart(2, "0")}`;
  const { setNodeRef } = useDroppable({
    id: `cell-${dateStr}`,
    data: { date: dateStr, calendarDay: cd },
  });

  return (
    <div ref={setNodeRef} className="h-full">
      {children}
      {isOver && (
        <div className="absolute inset-0 border-2 border-ym-blue-2 rounded-lg bg-ym-blue/20 pointer-events-none z-10" />
      )}
    </div>
  );
}

export default function CalendarView({
  posts,
  onPostClick,
  isAdmin,
  onAddPost,
  onDateChange,
}: {
  posts: Post[];
  onPostClick: (post: Post) => void;
  isAdmin?: boolean;
  onAddPost?: (date: string) => void;
  onDateChange?: (postId: string, newDate: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mobileSelectedDay, setMobileSelectedDay] = useState<CalendarDay | null>(null);
  const [draggedPost, setDraggedPost] = useState<Post | null>(null);
  const [overCellId, setOverCellId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays: CalendarDay[] = [];

  for (let i = offset - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    calendarDays.push({ day: d, month: m, year: y, isCurrentMonth: false });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, month, year, isCurrentMonth: true });
  }

  const cellsSoFar = calendarDays.length;
  const remainingInRow = cellsSoFar % 7 === 0 ? 0 : 7 - (cellsSoFar % 7);
  for (let i = 1; i <= remainingInRow; i++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    calendarDays.push({ day: i, month: m, year: y, isCurrentMonth: false });
  }

  const totalRows = calendarDays.length / 7;

  const getPostsForCalendarDay = (cd: CalendarDay) => {
    return posts.filter((p) => {
      if (!p.date) return false;
      const d = new Date(p.date);
      return d.getDate() === cd.day && d.getMonth() === cd.month && d.getFullYear() === cd.year;
    });
  };

  const formatDateISO = (cd: CalendarDay) => {
    const m = String(cd.month + 1).padStart(2, "0");
    const d = String(cd.day).padStart(2, "0");
    return `${cd.year}-${m}-${d}`;
  };

  const monthName = currentDate.toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setMobileSelectedDay(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setMobileSelectedDay(null);
  };
  const goToday = () => {
    setCurrentDate(new Date());
    setMobileSelectedDay(null);
  };

  const today = new Date();
  const isTodayCheck = (cd: CalendarDay) =>
    cd.day === today.getDate() &&
    cd.month === today.getMonth() &&
    cd.year === today.getFullYear();

  const mobileSelectedPosts = mobileSelectedDay
    ? getPostsForCalendarDay(mobileSelectedDay)
    : [];

  const handleDragStart = (event: DragStartEvent) => {
    const post = event.active.data.current?.post as Post;
    if (post) setDraggedPost(post);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverCellId(event.over?.id ? String(event.over.id) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedPost(null);
    setOverCellId(null);

    if (!over) return;

    const post = active.data.current?.post as Post;
    const newDate = over.data.current?.date as string;

    if (!post || !newDate) return;

    // Check if date actually changed
    const oldDate = post.date ? new Date(post.date).toISOString().split("T")[0] : null;
    if (oldDate === newDate) return;

    onDateChange?.(post.id, newDate);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <button
          onClick={prevMonth}
          className="p-1.5 sm:p-2 hover:bg-beige-2 rounded-lg transition text-base"
        >
          ←
        </button>
        <div className="text-center flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold capitalize">{monthName}</h2>
          <button
            onClick={goToday}
            className="text-[11px] text-ym-text-2 hover:text-ym-blue-2 transition px-2 py-0.5 rounded hover:bg-beige-2"
          >
            Dzisiaj
          </button>
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 sm:p-2 hover:bg-beige-2 rounded-lg transition text-base"
        >
          →
        </button>
      </div>

      {/* ===== MOBILE CALENDAR (< 768px) ===== */}
      <div className="block md:hidden">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-medium text-ym-text-2 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((cd, i) => {
            const hasPosts = getPostsForCalendarDay(cd).length > 0;
            const isSelected =
              mobileSelectedDay?.day === cd.day &&
              mobileSelectedDay?.month === cd.month &&
              mobileSelectedDay?.year === cd.year;
            const isCurrentMonth = cd.isCurrentMonth;
            const isT = isTodayCheck(cd);

            return (
              <button
                key={i}
                onClick={() => setMobileSelectedDay(isSelected ? null : cd)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition ${
                  isSelected
                    ? "bg-ym-blue-2"
                    : isT
                      ? "bg-ym-blue/30 border border-ym-blue-2"
                      : isCurrentMonth
                        ? "bg-beige-2"
                        : "bg-beige-2/50"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isSelected
                      ? "text-beige font-bold"
                      : isT
                        ? "text-ym-blue-2 font-bold"
                        : isCurrentMonth
                          ? "text-ym-text"
                          : "text-ym-text-2/40"
                  }`}
                >
                  {cd.day}
                </span>
                {hasPosts && (
                  <div className="flex gap-0.5 mt-0.5">
                    {getPostsForCalendarDay(cd).slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-beige" : "bg-ym-pink-2"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {mobileSelectedDay !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-ym-text">
                {mobileSelectedDay.day}{" "}
                {new Date(mobileSelectedDay.year, mobileSelectedDay.month).toLocaleDateString("pl-PL", { month: "long" })}
              </h3>
              {isAdmin && onAddPost && (
                <button
                  onClick={() => onAddPost(formatDateISO(mobileSelectedDay))}
                  className="text-xs px-3 py-1.5 bg-ym-text text-beige rounded-lg hover:bg-ym-text-2 transition"
                >
                  + Dodaj post
                </button>
              )}
            </div>
            {mobileSelectedPosts.length > 0 ? (
              <div className="space-y-2">
                {mobileSelectedPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => onPostClick(post)}
                    className="w-full text-left bg-beige-2 rounded-xl p-3 border border-beige-2 hover:border-ym-blue-2 transition flex items-center gap-3"
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
                        <span className="text-ym-text-2 text-[10px]">Brak</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <div className="flex items-center gap-2 mt-1">
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
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ym-text-2">Brak postów na ten dzień</p>
            )}
          </div>
        )}
      </div>

      {/* ===== DESKTOP CALENDAR (>= 768px) ===== */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="hidden md:flex flex-col flex-1 min-h-0">
          <div className="grid grid-cols-7 gap-1 shrink-0">
            {["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"].map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-medium text-ym-text-2 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className={`grid grid-cols-7 gap-1 flex-1 min-h-0 mb-2`} style={{ gridTemplateRows: `repeat(${totalRows}, 1fr)` }}>
            {calendarDays.map((cd, i) => {
              const dayPosts = getPostsForCalendarDay(cd);
              const isT = isTodayCheck(cd);
              const isCurrentMonth = cd.isCurrentMonth;
              const isEmpty = dayPosts.length === 0;
              const hasPosts = dayPosts.length > 0;
              const dateStr = formatDateISO(cd);
              const isDropOver = overCellId === `cell-${dateStr}`;

              const cellBg = isT
                ? "bg-ym-blue/20 border-ym-blue-2 hover:bg-beige-3"
                : isCurrentMonth
                  ? hasPosts
                    ? "border-beige-2 hover:bg-beige-3"
                    : "bg-beige-2 border-beige-2 hover:bg-beige-3"
                  : hasPosts
                    ? "border-beige-2/50 hover:bg-beige-2/60"
                    : "bg-beige-2/40 border-beige-2/50 hover:bg-beige-2/60";

              return (
                <div
                  key={i}
                  className={`border rounded-lg p-1.5 flex flex-col overflow-hidden group/cell relative transition-colors duration-150 ${cellBg}`}
                  style={hasPosts && !isT ? { backgroundColor: isCurrentMonth ? "#E5DED7" : "#EFE7E0" } : undefined}
                >
                  <DroppableCell cd={cd} isOver={isDropOver}>
                    <div className="flex flex-col h-full">
                      {/* Day number + badge row */}
                      <div className="flex items-center justify-between shrink-0 mb-0.5">
                        <span
                          className={`text-[11px] font-medium ${
                            isT
                              ? "text-ym-blue-3 font-bold"
                              : isCurrentMonth
                                ? "text-ym-text-2"
                                : "text-ym-text-2/40"
                          }`}
                        >
                          {cd.day === 1 && !isCurrentMonth
                            ? `${cd.day} ${new Date(cd.year, cd.month).toLocaleDateString("pl-PL", { month: "short" })}`
                            : cd.day}
                        </span>
                        {dayPosts.length === 1 && (
                          <StatusBadge status={dayPosts[0].status} />
                        )}
                      </div>

                      {/* Posts fill remaining space */}
                      <div className="flex-1 flex flex-col gap-0.5 min-h-0">
                        {dayPosts.map((post) => (
                          <DraggablePost
                            key={post.id}
                            post={post}
                            dayPosts={dayPosts}
                            onPostClick={onPostClick}
                            isAdmin={isAdmin}
                          />
                        ))}
                      </div>
                    </div>
                  </DroppableCell>

                  {/* Single centered + button on hover for empty cells */}
                  {isAdmin && onAddPost && isCurrentMonth && isEmpty && !draggedPost && (
                    <button
                      onClick={() => onAddPost(formatDateISO(cd))}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-all duration-200 rounded-lg z-20"
                    >
                      <span className="w-9 h-9 rounded-full bg-beige-4 flex items-center justify-center text-ym-text-2 text-xl leading-none transition-colors hover:bg-ym-text-3">
                        <span className="relative -top-px">+</span>
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag overlay - floating post preview */}
        <DragOverlay>
          {draggedPost && (
            <div className="bg-beige rounded-xl shadow-xl border border-ym-blue-2 p-2 w-32 opacity-90">
              {draggedPost.imageUrl && (
                <img
                  src={draggedPost.imageUrl}
                  alt=""
                  className="w-full h-20 object-cover rounded-lg"
                />
              )}
              <p className="text-[10px] font-medium text-ym-text truncate mt-1">
                {draggedPost.title}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Unscheduled posts */}
      {posts.filter((p) => !p.date).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-ym-text-2 mb-3">
            Bez daty ({posts.filter((p) => !p.date).length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {posts
              .filter((p) => !p.date)
              .map((post) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="text-left bg-beige-2 rounded-xl p-3 border border-beige-2 hover:border-ym-blue-2 transition"
                >
                  {post.imageUrl ? (
                    <div className="relative">
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="w-full h-20 sm:h-24 object-cover rounded-lg mb-2"
                      />
                      {post.media && post.media.length > 1 && (
                        <span className="absolute top-0.5 right-0.5 bg-ym-text/60 text-beige text-[8px] px-1 rounded">
                          {post.media.length}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-20 sm:h-24 bg-beige rounded-lg mb-2 flex items-center justify-center">
                      <span className="text-ym-text-2 text-xs">Brak zdjęcia</span>
                    </div>
                  )}
                  <p className="text-xs font-medium truncate">{post.title}</p>
                  <StatusBadge status={post.status} />
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
