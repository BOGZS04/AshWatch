import React from "react";
import { CheckCircle2, Home, ListFilter, Moon, Plus, Sparkles, Sun, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useDramas } from "../context/DramaContext.jsx";
import LogoMark from "./LogoMark.jsx";
import Splash from "./Splash.jsx";

const links = [
  { to: "/", label: "Dashboard", short: "Home", icon: Home },
  { to: "/watchlist", label: "Watchlist", short: "Watchlist", icon: ListFilter, count: true },
  { to: "/completed", label: "Completed", short: "Done", icon: CheckCircle2 },
  { to: "/recommend", label: "Recommend", short: "Recommend", icon: Sparkles },
  { to: "/add", label: "Add Drama", short: "Add", icon: Plus },
  { to: "/account", label: "Account", short: "Me", icon: UserRound },
];

export default function Layout() {
  const { user } = useAuth();
  const { dramas } = useDramas();
  const [dark, setDark] = useState(() => localStorage.getItem("ashwatch.theme") !== "light");
  const watchingCount = dramas.filter((drama) => drama.status === "Currently Watching").length;
  const displayName = user?.user_metadata?.display_name || "Drama fan";
  const possessiveName = `${displayName}${displayName.toLowerCase().endsWith("s") ? "'" : "'s"}`;
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("ashwatch.theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <>
      <Splash />
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
        <aside className="app-sidebar fixed left-0 top-0 z-30 hidden h-screen border-r border-[var(--line)] bg-[var(--surface)]/90 px-5 py-11 shadow-cozy backdrop-blur xl:block">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--accent)] text-lg font-black text-[#061827]">
              {initial}
            </div>
            <div>
              <div className="text-xl font-black text-[var(--brand)]">AshWatch</div>
              <div className="text-xs text-[var(--muted)]">{possessiveName} drama diary</div>
            </div>
          </div>
          <nav className="mt-10 grid gap-2">
            {links.map((link) => (
              <NavItem key={link.to} link={link} count={link.count ? watchingCount : null} />
            ))}
          </nav>
        </aside>

        <header className="app-header sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/85 px-4 py-3 backdrop-blur xl:px-8">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 xl:invisible">
                <LogoMark compact />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black text-[var(--brand)]">AshWatch</h1>
                <p className="truncate text-xs text-[var(--muted)]">{possessiveName} cozy K-drama corner</p>
              </div>
            </div>
            <button
              className="theme-switch"
              type="button"
              aria-label="Toggle dark mode"
              onClick={() => setDark((value) => !value)}
              title="Toggle dark mode"
            >
              <Sun className="theme-switch__sun" size={17} />
              <Moon className="theme-switch__moon" size={17} />
              <span />
            </button>
          </div>
        </header>

        <main className="app-main mx-auto max-w-[1500px] px-4 pb-28 pt-8 sm:px-6 lg:px-8 xl:pb-14">
          <Outlet />
        </main>

        <nav className="mobile-cinema-nav fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--line)] bg-[var(--surface)]/95 px-2 py-2 shadow-[0_-12px_30px_rgba(0,0,0,0.12)] backdrop-blur xl:hidden">
          <ul className="mx-auto grid max-w-3xl grid-cols-6 gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `mobile-nav-item ${isActive ? "mobile-nav-item--active" : ""}`
                  }
                >
                  <link.icon size={20} />
                  <span>{link.short}</span>
                  {link.count && watchingCount > 0 ? <b>{watchingCount}</b> : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

function NavItem({ link, count }) {
  return (
    <NavLink to={link.to} className={({ isActive }) => `nav-item ${isActive ? "nav-item--active" : ""}`}>
      <link.icon size={19} />
      <span>{link.label}</span>
      {count ? <b>{count}</b> : null}
    </NavLink>
  );
}
