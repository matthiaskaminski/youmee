"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import StatusBadge from "./StatusBadge";
import type { Post } from "@/types/post";

export default function PostModal({
  post,
  onClose,
  onUpdate,
  onDelete,
}: {
  post: Post;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (id: string) => void;
}) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editData, setEditData] = useState({
    title: post.title,
    description: post.description,
    hashtags: post.hashtags,
    status: post.status,
    date: post.date ? post.date.split("T")[0] : "",
    platform: post.platform,
  });
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const mediaItems = post.media && post.media.length > 0
    ? post.media
    : post.imageUrl
      ? [{ id: "legacy", url: post.imageUrl, type: "image" as const, order: 0 }]
      : [];

  const hasMultipleSlides = mediaItems.length > 1;

  const addComment = async () => {
    if (!comment.trim()) return;
    setSendingComment(true);
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, content: comment }),
    });
    setComment("");
    setSendingComment(false);
    onUpdate();
  };

  const saveEdit = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.append("title", editData.title);
    formData.append("description", editData.description);
    formData.append("hashtags", editData.hashtags);
    formData.append("status", editData.status);
    formData.append("date", editData.date);
    formData.append("platform", editData.platform);
    for (const file of newFiles) {
      formData.append("files", file);
    }

    await fetch(`/api/posts/${post.id}`, { method: "PUT", body: formData });
    setSaving(false);
    setEditing(false);
    setNewFiles([]);
    onUpdate();
  };

  const cycleStatus = async () => {
    const order = ["draft", "review", "approved", "published"];
    const next = order[(order.indexOf(post.status) + 1) % order.length];
    const fd = new FormData();
    fd.append("title", post.title);
    fd.append("status", next);
    await fetch(`/api/posts/${post.id}`, { method: "PUT", body: fd });
    onUpdate();
  };

  const prevSlide = () => setCurrentSlide((s) => Math.max(0, s - 1));
  const nextSlide = () => setCurrentSlide((s) => Math.min(mediaItems.length - 1, s + 1));

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-beige rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media carousel / video */}
        {mediaItems.length > 0 && (
          <div className="relative bg-beige-2 rounded-t-2xl">
            <div className="relative overflow-hidden rounded-t-2xl">
              {mediaItems[currentSlide]?.type === "video" ? (
                <video
                  src={mediaItems[currentSlide].url}
                  controls
                  autoPlay
                  className="w-full max-h-[500px] object-contain bg-black"
                />
              ) : (
                <img
                  src={mediaItems[currentSlide]?.url}
                  alt={post.title}
                  className="w-full max-h-[500px] object-contain"
                />
              )}
            </div>

            {/* Navigation arrows */}
            {hasMultipleSlides && (
              <>
                {currentSlide > 0 && (
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-beige/80 rounded-full flex items-center justify-center text-ym-text hover:bg-beige transition"
                  >
                    ←
                  </button>
                )}
                {currentSlide < mediaItems.length - 1 && (
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-beige/80 rounded-full flex items-center justify-center text-ym-text hover:bg-beige transition"
                  >
                    →
                  </button>
                )}
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {mediaItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2 h-2 rounded-full transition ${
                        i === currentSlide
                          ? "bg-ym-text"
                          : "bg-ym-text/30"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Slide counter */}
            {hasMultipleSlides && (
              <div className="absolute top-3 right-3 bg-ym-text/60 text-beige text-xs px-2 py-1 rounded-full">
                {currentSlide + 1} / {mediaItems.length}
              </div>
            )}

            {editing && (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-3 right-3 bg-beige/90 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-beige"
              >
                Zmień media
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setNewFiles(files);
              }}
            />
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            {editing ? (
              <input
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                className="text-xl font-bold bg-beige-2 rounded-lg px-3 py-1.5 w-full mr-4"
              />
            ) : (
              <h2 className="text-xl font-bold text-ym-text">{post.title}</h2>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge
                status={editing ? editData.status : post.status}
                onClick={
                  isAdmin ? (editing ? undefined : cycleStatus) : undefined
                }
              />
              <button
                onClick={onClose}
                className="text-ym-text-2 hover:text-ym-text text-xl leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Media type indicator */}
          {mediaItems.length > 0 && (
            <div className="flex items-center gap-2 mb-3 text-xs text-ym-text-2">
              {mediaItems.length > 1 && (
                <span className="bg-beige-2 px-2 py-0.5 rounded-full">
                  Karuzela ({mediaItems.length} slajdów)
                </span>
              )}
              {mediaItems.some((m) => m.type === "video") && (
                <span className="bg-beige-2 px-2 py-0.5 rounded-full">
                  Video
                </span>
              )}
            </div>
          )}

          {/* New files preview when editing */}
          {editing && newFiles.length > 0 && (
            <div className="mb-3 p-3 bg-beige-2 rounded-lg">
              <p className="text-xs text-ym-text-2 mb-2">
                Nowe pliki ({newFiles.length}):
              </p>
              <div className="flex gap-2 flex-wrap">
                {newFiles.map((f, i) => (
                  <span key={i} className="text-xs bg-beige px-2 py-1 rounded">
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Edit form or display */}
          {editing ? (
            <div className="space-y-3 mb-6">
              <textarea
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                placeholder="Opis posta..."
                className="w-full bg-beige-2 rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none"
              />
              <input
                value={editData.hashtags}
                onChange={(e) =>
                  setEditData({ ...editData, hashtags: e.target.value })
                }
                placeholder="#hashtagi"
                className="w-full bg-beige-2 rounded-lg px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-ym-text-2">Data</label>
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) =>
                      setEditData({ ...editData, date: e.target.value })
                    }
                    className="w-full bg-beige-2 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-ym-text-2">Status</label>
                  <select
                    value={editData.status}
                    onChange={(e) =>
                      setEditData({ ...editData, status: e.target.value })
                    }
                    className="w-full bg-beige-2 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="draft">Szkic</option>
                    <option value="review">Do akceptacji</option>
                    <option value="approved">Zaakceptowany</option>
                    <option value="published">Opublikowany</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-ym-text-2">Platforma</label>
                  <select
                    value={editData.platform}
                    onChange={(e) =>
                      setEditData({ ...editData, platform: e.target.value })
                    }
                    className="w-full bg-beige-2 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="both">Obie</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-ym-text text-beige rounded-lg text-sm font-medium hover:bg-ym-text-2 disabled:opacity-50"
                >
                  {saving ? "Zapisywanie..." : "Zapisz"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setNewFiles([]);
                  }}
                  className="px-4 py-2 bg-beige-2 rounded-lg text-sm"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              {post.description && (
                <p className="text-sm text-ym-text mb-2 whitespace-pre-wrap">
                  {post.description}
                </p>
              )}
              {post.hashtags && (
                <p className="text-sm text-ym-blue-2">{post.hashtags}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-ym-text-2">
                {post.date && (
                  <span>
                    {new Date(post.date).toLocaleDateString("pl-PL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
                <span className="capitalize">{post.platform}</span>
              </div>
              {isAdmin && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 bg-beige-2 rounded-lg text-sm hover:bg-ym-blue/50"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Usunąć ten post?")) onDelete(post.id);
                    }}
                    className="px-3 py-1.5 bg-ym-pink/50 text-ym-pink-2 rounded-lg text-sm hover:bg-ym-pink"
                  >
                    Usuń
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-beige-2 pt-4">
            <h3 className="text-sm font-semibold mb-3">
              Komentarze ({post.comments.length})
            </h3>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {post.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-beige shrink-0"
                    style={{
                      backgroundColor:
                        c.user.role === "admin" ? "#A9C1D3" : "#D3A9AB",
                    }}
                  >
                    {c.user.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.user.name}</span>
                      <span className="text-xs text-ym-text-2">
                        {new Date(c.createdAt).toLocaleDateString("pl-PL")}
                      </span>
                    </div>
                    <p className="text-sm text-ym-text-2">{c.content}</p>
                  </div>
                </div>
              ))}
              {post.comments.length === 0 && (
                <p className="text-sm text-ym-text-2">Brak komentarzy</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
                placeholder="Dodaj komentarz..."
                className="flex-1 bg-beige-2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue-2"
              />
              <button
                onClick={addComment}
                disabled={sendingComment || !comment.trim()}
                className="px-4 py-2 bg-ym-text text-beige rounded-lg text-sm font-medium hover:bg-ym-text-2 disabled:opacity-50"
              >
                Wyślij
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
