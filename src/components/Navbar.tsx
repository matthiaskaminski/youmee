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
    <nav className="bg-beige border-b border-beige-2 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight text-ym-text">
              YOUMEE
              <span className="text-ym-text-2 font-normal text-sm ml-2">
                Hub
              </span>
            </h1>

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
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-ym-text">
                {session?.user?.name}
              </p>
              <p className="text-xs text-ym-text-2">
                {isAdmin ? "Administrator" : "Klient"}
              </p>
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{
                  backgroundColor: isAdmin ? "#A9C1D3" : "#D3A9AB",
                }}
              >
                {session?.user?.name?.[0] || "?"}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-beige rounded-xl shadow-lg border border-beige-2 py-2">
                  <div className="sm:hidden px-4 py-2 border-b border-beige-2">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-ym-text-2">
                      {isAdmin ? "Administrator" : "Klient"}
                    </p>
                  </div>
                  <div className="sm:hidden border-b border-beige-2 py-1">
                    <button onClick={() => { onViewChange("calendar"); setMenuOpen(false); }} className="block w-full text-left px-4 py-1.5 text-sm hover:bg-beige">Kalendarz</button>
                    <button onClick={() => { onViewChange("feed"); setMenuOpen(false); }} className="block w-full text-left px-4 py-1.5 text-sm hover:bg-beige">Podgląd feedu</button>
                    <button onClick={() => { onViewChange("list"); setMenuOpen(false); }} className="block w-full text-left px-4 py-1.5 text-sm hover:bg-beige">Lista</button>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="block w-full text-left px-4 py-2 text-sm text-ym-text hover:bg-beige"
                  >
                    Wyloguj się
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
