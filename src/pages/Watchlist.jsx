import React from "react";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BackupControls from "../components/BackupControls.jsx";
import DramaCard from "../components/DramaCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LogoMark from "../components/LogoMark.jsx";
import PageHeader from "../components/PageHeader.jsx";
import RandomPickModal from "../components/RandomPickModal.jsx";
import { useDramas } from "../context/DramaContext.jsx";
import { GENRES, STATUSES } from "../data/constants.js";
import { sortByPriority } from "../utils/dramaMath.js";

export default function Watchlist() {
  const { dramas } = useDramas();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [genre, setGenre] = useState("All genres");
  const [sort, setSort] = useState("Most recent");
  const [picked, setPicked] = useState(null);

  const filtered = useMemo(() => {
    return dramas
      .filter((drama) => drama.title.toLowerCase().includes(query.toLowerCase()))
      .filter((drama) => status === "All statuses" || drama.status === status)
      .filter((drama) => genre === "All genres" || drama.genres.includes(genre))
      .sort((a, b) => {
        if (sort === "Sort by Priority") return sortByPriority(a, b);
        return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
      });
  }, [dramas, genre, query, sort, status]);

  function pickDrama() {
    const candidates = dramas.filter((drama) => drama.status === "Want to Watch");
    if (!candidates.length) return;
    setPicked(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  return (
    <div>
      <PageHeader
        title="My Watchlist"
        subtitle="All the dramas, all in one place."
        mascot={<LogoMark compact />}
        action={
          <button className="primary-button" type="button" onClick={pickDrama}>
            Pick My Next Drama
          </button>
        }
      />

      <BackupControls />

      <div className="filter-bar">
        <input
          className="field md:col-span-2"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title..."
        />
        <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All statuses</option>
          {STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select className="field" value={genre} onChange={(event) => setGenre(event.target.value)}>
          <option>All genres</option>
          {GENRES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select className="field" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option>Most recent</option>
          <option>Sort by Priority</option>
        </select>
      </div>

      {filtered.length ? (
        <div className="poster-grid mt-5">
          <Link className="add-drama-card" to="/add">
            <span>
              <Plus size={30} />
            </span>
            <strong>Add Drama</strong>
            <p>Track a new obsession</p>
          </Link>
          {filtered.map((drama) => (
            <DramaCard key={drama.id} drama={drama} />
          ))}
        </div>
      ) : (
        <div className="empty-state-spaced">
          <EmptyState
            title="No dramas found"
            message="Try another search or filter, or add a new drama to start filling this shelf."
            action={
              <Link className="primary-button" to="/add">
                <Plus size={18} /> Add Drama
              </Link>
            }
          />
        </div>
      )}

      <RandomPickModal drama={picked} onClose={() => setPicked(null)} />
    </div>
  );
}
