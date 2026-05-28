import React from "react";
import { Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { PRIORITY_LABELS, STATUS_STYLES } from "../data/constants.js";
import DramaPoster from "./DramaPoster.jsx";

export default function DramaCard({ drama, compact = false }) {
  return (
    <Link to={`/drama/${drama.id}`} className={`drama-card ${compact ? "drama-card--compact" : ""}`}>
      <div className="drama-card-poster">
        <DramaPoster drama={drama} />
        <div className="poster-topline">
          <span className={`badge ${STATUS_STYLES[drama.status] || ""}`}>{drama.status}</span>
          {drama.status === "Completed" && drama.rating ? (
            <span className="rating-badge">
              <Star size={14} fill="currentColor" /> {drama.rating}
            </span>
          ) : (
            <span className="priority-badge">
              {PRIORITY_LABELS[drama.priority] || drama.priority}
            </span>
          )}
        </div>
      </div>
      <div className="drama-card-body">
        <h2 className="line-clamp-2 text-lg font-black text-[var(--heading)]">{drama.title}</h2>
        <p className="mt-2 flex items-center gap-1 text-sm text-[var(--muted)]">
          <Clock size={15} /> ~{drama.episodes || 0} hrs to finish
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(drama.genres || []).slice(0, 3).map((genre) => (
            <span key={genre} className="genre-pill">
              {genre}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
