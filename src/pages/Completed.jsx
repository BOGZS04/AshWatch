import React from "react";
import { useMemo, useState } from "react";
import DramaCard from "../components/DramaCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LogoMark from "../components/LogoMark.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useDramas } from "../context/DramaContext.jsx";

export default function Completed() {
  const { dramas } = useDramas();
  const [sort, setSort] = useState("Sort by date finished");
  const completed = useMemo(() => {
    return dramas
      .filter((drama) => drama.status === "Completed")
      .sort((a, b) => {
        if (sort === "Sort by rating") return Number(b.rating || 0) - Number(a.rating || 0);
        if (sort === "Sort by title") return a.title.localeCompare(b.title);
        return new Date(b.date_completed || b.updated_at) - new Date(a.date_completed || a.updated_at);
      });
  }, [dramas, sort]);

  return (
    <div>
      <PageHeader
        title="Completed Dramas"
        subtitle="Your finished masterpieces."
        mascot={<LogoMark compact />}
        action={
          <select className="field min-w-56" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option>Sort by date finished</option>
            <option>Sort by rating</option>
            <option>Sort by title</option>
          </select>
        }
      />

      {completed.length ? (
        <div className="poster-grid poster-grid--completed">
          {completed.map((drama) => (
            <DramaCard key={drama.id} drama={drama} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing completed yet" message="Finish one drama and this shelf will get sparkly." />
      )}
    </div>
  );
}
