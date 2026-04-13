"use client";

import { useState, useEffect, useCallback } from "react";
import type { Idea } from "@/types/post";

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  post: { label: "Post", color: "bg-ym-blue text-ym-blue-5" },
  story: { label: "Story", color: "bg-ym-pink text-ym-pink-4" },
  reels: { label: "Reels", color: "bg-ym-green text-ym-green-4" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Nowy", color: "text-ym-blue-5", bg: "bg-ym-blue" },
  "in-progress": { label: "W trakcie", color: "text-ym-pink-4", bg: "bg-ym-pink" },
  done: { label: "Gotowy", color: "text-ym-green-4", bg: "bg-ym-green" },
};

export default function IdeasView() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("post");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("post");

  const fetchIdeas = useCallback(async () => {
    const res = await fetch("/api/ideas");
    const data = await res.json();
    setIdeas(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category }),
    });

    setTitle("");
    setDescription("");
    setCategory("post");
    setShowForm(false);
    setSaving(false);
    fetchIdeas();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch("/api/ideas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    fetchIdeas();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Na pewno usunąć ten pomysł?")) return;

    await fetch("/api/ideas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchIdeas();
  };

  const startEditing = (idea: Idea) => {
    setEditingId(idea.id);
    setEditTitle(idea.title);
    setEditDescription(idea.description);
    setEditCategory(idea.category);
  };

  const handleEditSave = async () => {
    if (!editingId || !editTitle.trim()) return;

    await fetch("/api/ideas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        title: editTitle,
        description: editDescription,
        category: editCategory,
      }),
    });

    setEditingId(null);
    fetchIdeas();
  };

  const filtered = filter === "all" ? ideas : ideas.filter((i) => i.status === filter);

  const counts = {
    all: ideas.length,
    new: ideas.filter((i) => i.status === "new").length,
    "in-progress": ideas.filter((i) => i.status === "in-progress").length,
    done: ideas.filter((i) => i.status === "done").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-ym-text-2">Ładowanie pomysłów...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-ym-text">Pomysły</h2>
          <p className="text-sm text-ym-text-2 mt-0.5">
            {ideas.length} {ideas.length === 1 ? "pomysł" : ideas.length < 5 ? "pomysły" : "pomysłów"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-ym-text text-beige text-sm font-medium hover:opacity-90 transition"
        >
          {showForm ? "Anuluj" : "+ Nowy pomysł"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-beige-2 rounded-2xl p-5 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ym-text-2 mb-1">Tytuł</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Krótki tytuł pomysłu"
                className="w-full px-3 py-2 rounded-xl bg-beige border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-ym-text-2 mb-1">Kategoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-beige border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30"
              >
                <option value="post">Post</option>
                <option value="story">Story</option>
                <option value="reels">Reels</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-ym-text-2 mb-1">Opis (opcjonalnie)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opisz pomysł bardziej szczegółowo..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-beige border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30 resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-ym-text text-beige text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Zapisywanie..." : "Dodaj pomysł"}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-brand">
        {(["all", "new", "in-progress", "done"] as const).map((s) => {
          const label = s === "all" ? "Wszystkie" : STATUS_CONFIG[s].label;
          const count = counts[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                filter === s
                  ? "bg-ym-text text-beige"
                  : "bg-beige-2 text-ym-text-2 hover:bg-beige-3"
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Ideas list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">💡</div>
          <p className="text-ym-text-2">
            {filter === "all" ? "Brak pomysłów – dodaj pierwszy!" : "Brak pomysłów w tej kategorii"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((idea) => {
            const cat = CATEGORY_LABELS[idea.category] || CATEGORY_LABELS.post;
            const st = STATUS_CONFIG[idea.status] || STATUS_CONFIG.new;
            const isEditing = editingId === idea.id;

            return (
              <div
                key={idea.id}
                className="bg-beige-2 rounded-2xl p-5 group"
              >
                {isEditing ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-beige border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30"
                      />
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-beige border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30"
                      >
                        <option value="post">Post</option>
                        <option value="story">Story</option>
                        <option value="reels">Reels</option>
                      </select>
                    </div>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-beige border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30 resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg text-sm text-ym-text-2 hover:bg-beige-3 transition"
                      >
                        Anuluj
                      </button>
                      <button
                        onClick={handleEditSave}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-ym-text text-beige hover:opacity-90 transition"
                      >
                        Zapisz
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold text-ym-text">
                            {idea.title}
                          </h3>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
                            {cat.label}
                          </span>
                        </div>
                        {idea.description && (
                          <p className="text-sm text-ym-text-2 leading-relaxed mt-1">
                            {idea.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => startEditing(idea)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-ym-text-3 hover:text-ym-text hover:bg-beige-3 transition"
                          title="Edytuj"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(idea.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-ym-text-3 hover:text-ym-pink-3 hover:bg-ym-pink/20 transition"
                          title="Usuń"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Footer: status + date */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-beige-3">
                      <div className="flex items-center gap-1.5">
                        {(["new", "in-progress", "done"] as const).map((s) => {
                          const cfg = STATUS_CONFIG[s];
                          const active = idea.status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(idea.id, s)}
                              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                                active
                                  ? `${cfg.bg} ${cfg.color}`
                                  : "bg-beige-3/50 text-ym-text-3 hover:bg-beige-3"
                              }`}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[11px] text-ym-text-3">
                        {new Date(idea.createdAt).toLocaleDateString("pl-PL")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
