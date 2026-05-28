import React from "react";
import { Sparkles } from "lucide-react";

export default function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-8 text-center">
      <Sparkles className="mx-auto text-[var(--accent)]" size={34} />
      <h2 className="mt-3 text-xl font-black text-[var(--heading)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[var(--muted)]">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
