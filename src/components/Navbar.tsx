"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

type ViewType = "calendar" | "feed" | "list";

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("Nowe haslo musi miec minimum 8 znakow");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Hasla nie sa takie same");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Wystapil blad");
      } else {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Wystapil blad polaczenia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-beige rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-ym-text">Zmien haslo</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-beige-2 transition text-ym-text-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-ym-text-2 mb-1">Obecne haslo</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-beige-2 border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-ym-text-2 mb-1">Nowe haslo</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-beige-2 border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm text-ym-text-2 mb-1">Potwierdz nowe haslo</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-beige-2 border border-beige-3 text-ym-text text-sm focus:outline-none focus:ring-2 focus:ring-ym-blue/30"
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-sm text-ym-pink-3 bg-ym-pink/10 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-sm text-ym-green bg-ym-green/10 px-3 py-2 rounded-lg">Haslo zostalo zmienione</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-ym-text text-beige text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Zapisywanie..." : "Zmien haslo"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Navbar({
  view,
  onViewChange,
}: {
  view: ViewType;
  onViewChange: (v: ViewType) => void;
}) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [desktopDropdown, setDesktopDropdown] = useState(false);
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

              {/* Desktop dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setDesktopDropdown(!desktopDropdown)}
                  className="text-xs text-ym-text-2 hover:text-ym-text transition px-2 py-1 rounded hover:bg-beige-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {desktopDropdown && (
                  <>
                    <div className="fixed inset-0 z-[49]" onClick={() => setDesktopDropdown(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-beige border border-beige-2 rounded-xl shadow-lg py-1 w-44 z-[50]">
                      <button
                        onClick={() => { setShowPasswordModal(true); setDesktopDropdown(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-ym-text hover:bg-beige-2 transition"
                      >
                        Zmien haslo
                      </button>
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full text-left px-3 py-2 text-sm text-ym-pink-3 hover:bg-ym-pink/20 transition"
                      >
                        Wyloguj
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      <div className="sm:hidden">
        {/* Backdrop */}
        <div
          className={`fixed top-12 left-0 right-0 bottom-0 bg-black/30 z-[55] transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Slide-down menu */}
        <div
          className={`fixed top-12 left-0 right-0 z-[56] bg-beige border-b border-beige-2 shadow-lg rounded-b-2xl transition-all duration-300 ease-out overflow-hidden ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
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
              onClick={() => { setShowPasswordModal(true); setMenuOpen(false); }}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-ym-text-2 hover:bg-beige-2 transition mt-2"
            >
              Zmien haslo
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-ym-pink-3 hover:bg-ym-pink/20 transition"
            >
              Wyloguj sie
            </button>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}
