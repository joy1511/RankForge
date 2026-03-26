import { Link, useLocation } from "react-router";
import { Home, PenTool, Search, History, User } from "lucide-react";

const navItems = [
  { path: "/app", icon: Home, label: "Dashboard" },
  { path: "/app/generate", icon: PenTool, label: "Generate Blog" },
  { path: "/app/keywords", icon: Search, label: "Keyword Analyzer" },
  { path: "/app/history", icon: History, label: "History" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col border-r border-[--border-subtle] z-50"
        style={{ background: "#FFFFFF" }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[--border-subtle]">
          <Link to="/" className="text-xl font-bold tracking-tight text-[--text-primary] hover:opacity-80 transition-opacity">RankForge</Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${isActive
                  ? "text-[--text-primary] bg-[--bg-tertiary] font-medium"
                  : "text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-tertiary]/50"
                  }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Links */}
        <div className="p-4 border-t border-[--border-subtle] space-y-1">
          <Link
            to="/app"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-tertiary]/50 transition-all text-sm"
          >
            <User className="w-[18px] h-[18px]" />
            <span>Profile</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-[--border-subtle] z-50"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 ${isActive ? "text-[--text-primary]" : "text-[--text-tertiary]"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}