import React from "react";
import { ArrowLeft, Edit, Heart, MessageSquareQuote, RotateCcw, Sparkles, ThumbsUp, Trash2, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import PosterImage from "../components/PosterImage.jsx";
import { useDramas } from "../context/DramaContext.jsx";
import { STATUS_STYLES } from "../data/constants.js";
import { formatDate } from "../utils/dramaMath.js";

export default function DramaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dramas, deleteDrama } = useDramas();
  const drama = dramas.find((item) => item.id === id);

  if (!drama) {
    return (
      <EmptyState
        title="Drama not found"
        message="This page may belong to a drama that was deleted."
        action={
          <Link className="primary-button" to="/watchlist">
            Back to Watchlist
          </Link>
        }
      />
    );
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete "${drama.title}" from your AshWatch account?`);
    if (!confirmed) return;
    await deleteDrama(drama.id);
    navigate("/watchlist");
  }

  return (
    <div className="detail-shell">
      <Link className="back-link" to="/watchlist">
        <ArrowLeft size={18} /> Back
      </Link>

      <section className="detail-hero">
        {drama.poster_url ? <PosterImage src={drama.poster_url} alt={drama.title} /> : <div className="detail-hero-empty">{drama.title}</div>}
        <div className="detail-hero-shade" />
        <span className={`badge detail-status ${STATUS_STYLES[drama.status] || ""}`}>{drama.status}</span>
        <div className="detail-hero-copy">
          <h1>{drama.title}</h1>
        </div>
        <div className="detail-genre-row">
          {drama.genres.map((genre) => (
            <span className="genre-pill" key={genre}>
              {genre}
            </span>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <h2>Drama Info</h2>
        <div className="detail-info-grid">
          <InfoRow label="Episodes" value={drama.episodes || 0} />
          <InfoRow label="Time to finish" value={`~${drama.episodes || 0} hrs`} />
          <InfoRow label="Date added" value={formatDate(drama.created_at)} />
          <InfoRow label="Started on" value={formatDate(drama.date_started)} />
          <InfoRow label="Finished on" value={formatDate(drama.date_completed)} />
        </div>
      </section>

      <section className="detail-section">
        <h2>My Rating</h2>
        <div className="star-row">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < Number(drama.rating || 0) ? "star-on" : ""}>
              ★
            </span>
          ))}
          <b>{drama.rating ? `${drama.rating}/5` : "Not rated"}</b>
        </div>
      </section>

      <section className="detail-section">
        <h2>Diary Details</h2>
        <div className="diary-badges">
          <span>{drama.watch_mood || "Mood not set"}</span>
          <span>{drama.would_recommend || "Recommendation pending"}</span>
          <span>{drama.rewatchable || "Rewatch not set"}</span>
          <span>{drama.emotional_impact || "Impact not set"}</span>
        </div>
        <div className="detail-list">
          <DetailItem icon={UserRound} label="Favorite character" value={drama.favorite_character || "Not set"} />
          <DetailItem icon={Heart} label="This drama made me" value={drama.watch_mood || "Still deciding"} />
          <DetailItem icon={Sparkles} label="Emotional impact" value={drama.emotional_impact || "Not set"} />
          <DetailItem icon={RotateCcw} label="Rewatchable" value={drama.rewatchable || "Not sure yet"} />
          <DetailItem icon={ThumbsUp} label="Would recommend" value={drama.would_recommend || "Ask Ashley later"} />
          <DetailItem icon={MessageSquareQuote} label="Favorite quote" value={drama.favorite_quote || "No quote saved"} />
        </div>
      </section>

      {drama.review ? (
        <section className="detail-section">
          <h2>Personal Review</h2>
          <p className="detail-review">{drama.review}</p>
        </section>
      ) : null}

      <div className="detail-actions">
        <Link className="primary-button" to={`/add/${drama.id}`}>
          <Edit size={18} /> Edit
        </Link>
        <button className="danger-button" type="button" onClick={handleDelete}>
          <Trash2 size={18} /> Delete
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="detail-item">
      <Icon size={21} />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
