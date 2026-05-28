import React from "react";
import { Clapperboard } from "lucide-react";
import PosterImage from "./PosterImage.jsx";

export default function DramaPoster({ drama, className = "" }) {
  if (drama.poster_url) {
    return <PosterImage className={`poster ${className}`} src={drama.poster_url} alt={drama.title} />;
  }

  return (
    <div className={`poster poster-placeholder ${className}`}>
      <Clapperboard size={32} />
      <span>{drama.title}</span>
    </div>
  );
}
