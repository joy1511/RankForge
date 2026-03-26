import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useLocation } from "react-router";
import { AuthModal } from "../AuthModal";
import { getStoredUser, isAuthenticated, logout } from "../../services/auth";
import type { AuthUser } from "../../services/auth";

const breadcrumbMap: Record<string, string> = {
  "/app": "Dashboard",
  "/app/generate": "Generate Blog",
  "/app/keywords": "Keyword Analyzer",
  "/app/history": "History",
};

export function TopBar() {
  const location = useLocation();
  const breadcrumb = breadcrumbMap[location.pathname] || "Dashboard";

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getStoredUser());
    }
  }, []);

  const handleAuth = (authedUser: AuthUser) => {
    setUser(authedUser);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <>
      <header
        className="h-16 border-b border-[--border-subtle] flex items-center justify-between px-6 lg:px-8"
        style={{ background: "#FFFFFF" }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[--text-primary] tracking-tight">{breadcrumb}</h2>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2D2B55] flex items-center justify-center text-white text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-[--text-primary]">{user.name}</p>
                <p className="text-xs text-[--text-tertiary]">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-[--bg-tertiary] transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-[--text-secondary]" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="btn-primary text-sm px-4 py-2 rounded-lg"
            >
              Login / Signup
            </button>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuth={handleAuth}
      />
    </>
  );
}