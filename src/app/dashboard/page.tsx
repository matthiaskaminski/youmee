"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import CalendarView from "@/components/CalendarView";
import FeedPreview from "@/components/FeedPreview";
import ListView from "@/components/ListView";
import PostModal from "@/components/PostModal";
import CreatePostForm from "@/components/CreatePostForm";
import type { Post } from "@/types/post";

type ViewType = "calendar" | "feed" | "list";

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [view, setView] = useState<ViewType>("calendar");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [addPostDate, setAddPostDate] = useState<string | null>(null);

  const userEmail = session?.user?.email;
  const isCreator = userEmail === "maciek@youmee.pl"; // can create/edit/delete
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (authStatus === "authenticated") {
      fetchPosts();
    }
  }, [authStatus, router, fetchPosts]);

  const handlePostClick = (post: Post) => {
    const full = posts.find((p) => p.id === post.id);
    if (full) setSelectedPost(full);
  };

  const handlePostUpdate = async () => {
    await fetchPosts();
    if (selectedPost) {
      const res = await fetch("/api/posts");
      const data = await res.json();
      const updated = data.find((p: Post) => p.id === selectedPost.id);
      if (updated) setSelectedPost(updated);
    }
  };

  const handlePostDelete = async (id: string) => {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setSelectedPost(null);
    fetchPosts();
  };

  const handleReorder = async (updates: { id: string; order: number }[]) => {
    setPosts((prev) => {
      const newPosts = [...prev];
      for (const update of updates) {
        const post = newPosts.find((p) => p.id === update.id);
        if (post) post.order = update.order;
      }
      return newPosts;
    });

    await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  const handleAddPostFromCalendar = (date: string) => {
    setAddPostDate(date);
  };

  const handleDateChange = async (postId: string, newDate: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, date: new Date(newDate).toISOString() } : p
      )
    );

    await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId, date: newDate }),
    });

    fetchPosts();
  };

  const handlePostCreated = () => {
    setAddPostDate(null);
    fetchPosts();
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-ym-text-2">Ładowanie...</div>
      </div>
    );
  }

  // Calendar view: full-height layout, no scroll
  if (view === "calendar") {
    return (
      <div className="h-screen bg-beige flex flex-col overflow-hidden">
        <Navbar view={view} onViewChange={setView} />

        {/* Stats bar - 2x2 on mobile, 4 cols on desktop */}
        <div className="px-3 sm:px-6 lg:px-8 py-1.5 max-w-[1600px] mx-auto w-full shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-beige-2 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <p className="text-lg font-bold text-ym-text">{posts.length}</p>
              <p className="text-xs text-ym-text-2">Wszystkie</p>
            </div>
            <div className="bg-beige-2 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <p className="text-lg font-bold text-ym-pink-3">
                {posts.filter((p) => p.status === "review").length}
              </p>
              <p className="text-xs text-ym-text-2">Do akceptacji</p>
            </div>
            <div className="bg-beige-2 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <p className="text-lg font-bold text-ym-green-3">
                {posts.filter((p) => p.status === "approved").length}
              </p>
              <p className="text-xs text-ym-text-2">Zaakceptowane</p>
            </div>
            <div className="bg-beige-2 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <p className="text-lg font-bold text-ym-blue-3">
                {posts.filter((p) => p.status === "published").length}
              </p>
              <p className="text-xs text-ym-text-2">Opublikowane</p>
            </div>
          </div>
        </div>

        {/* Calendar fills remaining space */}
        <div className="flex-1 min-h-0 px-3 sm:px-6 lg:px-8 pb-2 max-w-[1600px] mx-auto w-full">
          <CalendarView
            posts={posts}
            onPostClick={handlePostClick}
            isAdmin={isCreator}
            canDrag={isAdmin}
            onAddPost={handleAddPostFromCalendar}
            onDateChange={handleDateChange}
          />
        </div>

        {/* Create post modal overlay */}
        {addPostDate && isCreator && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setAddPostDate(null)}
          >
            <div
              className="w-full max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CreatePostForm
                onCreated={handlePostCreated}
                defaultDate={addPostDate}
                defaultOpen={true}
                onClose={() => setAddPostDate(null)}
              />
            </div>
          </div>
        )}

        {selectedPost && (
          <PostModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onUpdate={handlePostUpdate}
            onDelete={handlePostDelete}
          />
        )}
      </div>
    );
  }

  // Other views: normal scrollable layout
  return (
    <div className="min-h-screen bg-beige">
      <Navbar view={view} onViewChange={setView} />

      <main className="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1600px]">
        {/* Admin: create post (only on non-calendar views) */}
        {isCreator && (
          <div className="mb-6">
            <CreatePostForm onCreated={fetchPosts} />
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-beige-2 rounded-xl p-4">
            <p className="text-2xl font-bold text-ym-text">{posts.length}</p>
            <p className="text-sm text-ym-text-2">Wszystkie posty</p>
          </div>
          <div className="bg-beige-2 rounded-xl p-4">
            <p className="text-2xl font-bold text-ym-pink-3">
              {posts.filter((p) => p.status === "review").length}
            </p>
            <p className="text-sm text-ym-text-2">Do akceptacji</p>
          </div>
          <div className="bg-beige-2 rounded-xl p-4">
            <p className="text-2xl font-bold text-ym-green-3">
              {posts.filter((p) => p.status === "approved").length}
            </p>
            <p className="text-sm text-ym-text-2">Zaakceptowane</p>
          </div>
          <div className="bg-beige-2 rounded-xl p-4">
            <p className="text-2xl font-bold text-ym-blue-3">
              {posts.filter((p) => p.status === "published").length}
            </p>
            <p className="text-sm text-ym-text-2">Opublikowane</p>
          </div>
        </div>

        {view === "feed" && (
          <FeedPreview
            posts={posts}
            onPostClick={handlePostClick}
            onReorder={handleReorder}
          />
        )}
        {view === "list" && (
          <ListView posts={posts} onPostClick={handlePostClick} />
        )}
      </main>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdate={handlePostUpdate}
          onDelete={handlePostDelete}
        />
      )}
    </div>
  );
}
