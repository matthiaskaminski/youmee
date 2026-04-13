"use client";

import { useState, useEffect, useCallback } from "react";
import type { Opinion } from "@/types/post";

export default function OpinionsView() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [person, setPerson] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchOpinions = useCallback(async () => {
    const res = await fetch("/api/opinions");
    const data = await res.json();
    setOpinions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOpinions();
  }, [fetchOpinions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person.trim() || !content.trim()) return;

    setSaving(true);
    await fetch("/api/opinions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person, content, source }),
    });

    setPerson("");
    setContent("");
    setSource("");
    setShowForm(false);
    setSaving(false);
    fetchOpinions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Na pewno usunąć tę opinię?")) return;

    await fetch("/api/opinions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchOpinions();
  };

  const sourceLabel = (src: string) => {
    const map: Record<string, { label: string; color: string }> = {
      google: { label: "Google", color: "bg-ym-blue text-ym-blue-5" },
      instagram: { label: "Instagram", color: "bg-ym-pink text-ym-pink-4" },
      facebook: { label: "Facebook", color: "bg-ym-blue text-ym-blue-5" },
      tiktok: { label: "TikTok", color: "bg-ym-text-4 text-ym-text" },
      email: { label: "E-mail", color: "bg-ym-green text-ym-green-4" },
      inne: { label: "Inne", color: "bg-beige-3 text-ym-text-2" },
    };
    return map[src.toLowerCase()] || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-ym-text-2">Ładowanie opinii...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-ym-text">Opinie</h2>
          <p className="text-sm text-ym-text-2 mt-0.5">
            {opinions.length} {opinions.length === 1 ? "opinia" : opinions.length < 5 ? "opinie" : "opinii"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-ym-text text-beige text-sm font-medium hover:opacity-90 transition"
        >
          {showForm ? "Anuluj" : "+ Dodaj opinię"}
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
              <label className="block text-sm text-ym-text-2 mb-1">Osoba</label>
              <input
                type="text"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="Imię i nazwisko lub nick"
                className="w-full px-3 py-2 rounded-xl bg-beige border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-ym-text-2 mb-1">Źródło</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-beige border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30"
              >
                <option value="">Wybierz źródło...</option>
                <option value="google">Google</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="email">E-mail</option>
                <option value="inne">Inne</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-ym-text-2 mb-1">Treść opinii</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Co powiedział/a o marce..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-beige border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30 resize-none"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-ym-text text-beige text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Zapisywanie..." : "Dodaj opinię"}
            </button>
          </div>
        </form>
      )}

      {/* Opinions list */}
      {opinions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">💬</div>
          <p className="text-ym-text-2">Brak opinii – dodaj pierwszą!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {opinions.map((op) => {
            const src = sourceLabel(op.source);
            return (
              <div
                key={op.id}
                className="bg-beige-2 rounded-2xl p-5 relative group"
              >
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(op.id)}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-ym-text-3 hover:text-ym-pink-3 hover:bg-ym-pink/20 transition opacity-0 group-hover:opacity-100"
                  title="Usuń"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Quote */}
                <div className="text-ym-text-3 text-2xl leading-none mb-2">&ldquo;</div>
                <p className="text-sm text-ym-text leading-relaxed mb-4">
                  {op.content}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-beige-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-ym-blue-2 flex items-center justify-center text-xs font-bold text-white">
                      {op.person[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-ym-text">
                      {op.person}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {src && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${src.color}`}>
                        {src.label}
                      </span>
                    )}
                    <span className="text-[11px] text-ym-text-3">
                      {new Date(op.createdAt).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
