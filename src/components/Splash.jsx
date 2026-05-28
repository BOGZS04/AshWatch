import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import LogoMark from "./LogoMark.jsx";

export default function Splash() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(() => !sessionStorage.getItem("ashwatch.splash.seen"));
  const displayName = user?.user_metadata?.display_name || "Drama fan";
  const possessiveName = `${displayName}${displayName.toLowerCase().endsWith("s") ? "'" : "'s"}`;

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem("ashwatch.splash.seen", "true");
      setVisible(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#061827] text-sky-100">
      <div className="text-center">
        <LogoMark />
        <h1 className="mt-5 font-display text-4xl font-black text-sky-200">AshWatch</h1>
        <p className="mt-2 text-sm text-sky-100/70">{possessiveName} cozy K-drama corner</p>
        <div className="mt-7 flex justify-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-sky-300/40" />
          <span className="h-3 w-3 animate-pulse rounded-full bg-sky-300/70 [animation-delay:160ms]" />
          <span className="h-3 w-3 animate-pulse rounded-full bg-sky-300 [animation-delay:320ms]" />
        </div>
      </div>
    </div>
  );
}
