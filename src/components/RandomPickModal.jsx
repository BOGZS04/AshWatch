import React from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import DramaCard from "./DramaCard.jsx";

export default function RandomPickModal({ drama, onClose }) {
  if (!drama) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 px-4 backdrop-blur-sm" role="dialog">
      <div className="w-full max-w-lg rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-cozy">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--accent)]">Snoopy picked...</p>
            <h2 className="text-2xl font-black text-[var(--heading)]">Your next obsession</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <DramaCard drama={drama} />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button className="secondary-button" type="button" onClick={onClose}>
            Maybe later
          </button>
          <Link className="primary-button" to={`/drama/${drama.id}`}>
            Open drama
          </Link>
        </div>
      </div>
    </div>
  );
}
