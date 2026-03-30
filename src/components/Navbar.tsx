"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

type ViewType = "calendar" | "feed" | "list";

export default function Navbar({
  view,
  onViewChange,
}: {
  view: ViewType;
  onViewChange: (v: ViewType) => void;
}) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  return (
    <>
      <nav className="bg-beige border-b border-beige-2 sticky top-0 z-50 relative">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <h1 className="text-xl font-bold tracking-tight text-ym-text">
              YOUMEE
              <span className="text-ym-text-2 font-normal text-sm ml-2">
                Hub
              </span>
            </h1>

            {/* Desktop tabs */}
            <div className="hidden sm:flex items-center bg-beige-2 rounded-xl p-1">
              <button
                onClick={() => onViewChange("calendar")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  view === "calendar"
                    ? "bg-ym-text text-beige"
                    : "text-ym-text-2 hover:text-ym-text hover:bg-beige-3"
                }`}
              >
                Kalendarz
              </button>
              <button
                onClick={() => onViewChange("feed")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  view === "feed"
                    ? "bg-ym-text text-beige"
                    : "text-ym-text-2 hover:text-ym-text hover:bg-beige-3"
                }`}
              >
                Podgląd feedu
              </button>
              <button
                onClick={() => onViewChange("list")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  view === "list"
                    ? "bg-ym-text text-beige"
                    : "text-ym-text-2 hover:text-ym-text hover:bg-beige-3"
                }`}
              >
                Lista
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-ym-text">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-ym-text-2">
                  {isAdmin ? "Admin" : "Widz"}
                </p>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-beige-2 transition z-[60]"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-ym-text">
                  {menuOpen ? (
                    <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  ) : (
                    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  )}
                </svg>
              </button>

              {/* Desktop logout */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-xs text-ym-text-2 hover:text-ym-text transition px-2 py-1 rounded hover:bg-beige-2"
                >
                  Wyloguj
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      <div className="sm:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/30 z-[55] transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Slide-down menu */}
        <div
          className={`fixed top-12 left-0 right-0 z-[56] bg-beige border-b border-beige-2 shadow-lg rounded-b-2xl transition-all duration-300 ease-out overflow-hidden ${
            menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-4 space-y-1">
            <div className="flex items-center gap-3 pb-3 border-b border-beige-2 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ backgroundColor: isAdmin ? "#A9C1D3" : "#D3A9AB" }}
              >
                {session?.user?.name?.[0] || "?"}
              </div>
              <div>
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-[11px] text-ym-text-2">{isAdmin ? "Admin" : "Widz"}</p>
              </div>
            </div>

            {(["calendar", "feed", "list"] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => { onViewChange(v); setMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  view === v
                    ? "bg-ym-text text-beige"
                    : "text-ym-text-2 hover:bg-beige-2"
                }`}
              >
                {v === "calendar" ? "Kalendarz" : v === "feed" ? "Podgląd feedu" : "Lista"}
              </button>
            ))}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-ym-pink-3 hover:bg-ym-pink/20 transition mt-2"
            >
              Wyloguj się
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
