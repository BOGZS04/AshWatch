import React from "react";
import { Loader2, PlusCircle, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import EmptyState from "../components/EmptyState.jsx";
import LogoMark from "../components/LogoMark.jsx";
import PageHeader from "../components/PageHeader.jsx";
import PosterImage from "../components/PosterImage.jsx";
import { useDramas } from "../context/DramaContext.jsx";
import { GENRES, LENGTHS, MOODS } from "../data/constants.js";

const recommendationClientCache = new Map();
const CLIENT_CACHE_LIMIT = 20;

function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function makeRecommendationCacheKey({ mood, length, genres, recentlyLoved, watchedDramas, previousRecommendations }) {
  return JSON.stringify({
    mood,
    length,
    genres: [...genres].sort(),
    recentlyLoved: recentlyLoved.trim().toLowerCase(),
    watchedDramas: watchedDramas.map(normalizeTitle).sort(),
    previousRecommendations: previousRecommendations.map(normalizeTitle).sort(),
  });
}

export default function Recommend() {
  const { dramas, addDrama } = useDramas();
  const [mood, setMood] = useState("Romantic");
  const [length, setLength] = useState("Medium - 12-20 eps");
  const [genres, setGenres] = useState(["Romance"]);
  const [recentlyLoved, setRecentlyLoved] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [previousRecommendations, setPreviousRecommendations] = useState([]);

  function toggleGenre(genre) {
    setGenres((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre],
    );
  }

  async function requestRecommendations({ refresh = false } = {}) {
    setLoading(true);
    setError("");
    setStatusMessage(refresh ? "Finding a fresh set and skipping the earlier picks." : "Asking the local AI recommender.");
    const currentTitles = refresh ? recommendations.map((rec) => rec.title) : [];
    const exclusions = [...previousRecommendations, ...currentTitles];
    const payload = {
      mood,
      length,
      genres,
      recentlyLoved,
      watchedDramas: dramas.map((drama) => drama.title),
      previousRecommendations: exclusions,
    };
    const cacheKey = makeRecommendationCacheKey(payload);
    if (!refresh) setRecommendations([]);

    try {
      const cached = recommendationClientCache.get(cacheKey);
      if (cached) {
        setRecommendations(cached);
        setPreviousRecommendations((current) => [...new Set([...current, ...cached.map((rec) => rec.title)])]);
        setStatusMessage("Loaded from your local recommendation cache.");
        toast.success("Snoopy found these fast.");
        return;
      }

      const apiUrl =
        import.meta.env.VITE_RECOMMEND_API_URL ||
        (import.meta.env.DEV ? "http://localhost:8787/api/recommend" : "/api/recommend");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Recommendation request failed.");

      const blocked = new Set([...dramas.map((drama) => drama.title), ...exclusions].map(normalizeTitle));
      const seen = new Set();
      const unique = (data.recommendations || []).filter((rec) => {
        const key = normalizeTitle(rec.title || "");
        if (!key || blocked.has(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (!unique.length) {
        setRecommendations([]);
        setError("No new dramas came back after filtering your watchlist and previous picks. Try fewer filters.");
        return;
      }

      setRecommendations(unique);
      setPreviousRecommendations((current) => [...new Set([...current, ...unique.map((rec) => rec.title)])]);
      recommendationClientCache.set(cacheKey, unique);
      if (recommendationClientCache.size > CLIENT_CACHE_LIMIT) {
        const oldestKey = recommendationClientCache.keys().next().value;
        recommendationClientCache.delete(oldestKey);
      }
      setStatusMessage(data.cached ? "Loaded from the local AI server cache." : "Fresh AI picks are ready.");
      toast.success(`Snoopy found ${unique.length} drama${unique.length === 1 ? "" : "s"}.`);
    } catch (requestError) {
      setError(requestError.message);
      setStatusMessage("");
      toast.error("Snoopy needs a little help.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    requestRecommendations({ refresh: false });
  }

  async function addRecommendation(rec) {
    const alreadyTracked = dramas.some((drama) => normalizeTitle(drama.title) === normalizeTitle(rec.title));
    if (alreadyTracked) {
      toast.error(`${rec.title} is already in AshWatch.`);
      return;
    }
    await addDrama({
      title: rec.title,
      poster_url: "",
      genres: rec.genres || [],
      status: "Want to Watch",
      episodes: rec.episodes || 16,
      priority: "Medium",
      notes: rec.reason,
      rating: null,
      date_started: "",
      date_completed: "",
      favorite_character: "",
      watch_mood: mood,
      would_recommend: "",
      review: "",
      favorite_quote: "",
      emotional_impact: "",
      rewatchable: "",
    });
  }

  return (
    <div>
      <PageHeader title="Recommend Me a Drama" subtitle="Snoopy will pick out 10 perfect dramas just for you." />

      <section className="match-hero">
        <div className="match-poster-fan" aria-hidden="true">
          {dramas
            .filter((drama) => drama.poster_url)
            .slice(0, 3)
            .map((drama, index) => (
              <PosterImage className={`match-poster-fan__item match-poster-fan__item--${index + 1}`} key={drama.id} src={drama.poster_url} alt="" />
            ))}
        </div>
        <div>
          <p className="match-kicker">AI matchmaker</p>
          <h2>Find your next great K-drama match</h2>
          <p>Pick a mood, a length, and a few genres. AshWatch will skip anything already in your diary.</p>
        </div>
      </section>

      <form className="form-panel recommend-panel" onSubmit={handleSubmit}>
        <div className="recommend-mascot">
          <LogoMark compact variant="tv" />
        </div>
        <ToggleGroup label="Mood right now" options={MOODS} selected={[mood]} onPick={setMood} />
        <ToggleGroup label="Preferred length" options={LENGTHS} selected={[length]} onPick={setLength} />
        <ToggleGroup label="Genres in the mood for" options={GENRES.slice(0, 9)} selected={genres} onPick={toggleGenre} />
        <label className="field-label">
          I recently loved... (optional)
          <input
            className="field"
            value={recentlyLoved}
            onChange={(event) => setRecentlyLoved(event.target.value)}
            placeholder="e.g. Crash Landing on You"
          />
        </label>
        <button className="primary-button w-full justify-center py-4" type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {loading ? "Snoopy is thinking..." : "Get my 10 recommendations"}
        </button>
        {statusMessage ? <p className="ai-status">{statusMessage}</p> : null}
        {error ? <p className="ai-error">{error}</p> : null}
      </form>

      {loading && !recommendations.length ? (
        <div className="thinking-state mt-7">
          <img src="/mascots/snoopy-thinking-placeholder.jpg" alt="Snoopy thinking placeholder" />
          <EmptyState title="Snoopy is thinking" message="The app is checking your watchlist, skipped picks, and current mood." />
        </div>
      ) : null}

      {recommendations.length ? (
        <section className="recommend-results mt-7">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[var(--heading)]">Your 10 picks</h2>
            <p className="mt-1 text-[var(--muted)]">Not feeling these? Hit refresh for new picks that skip the current set.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {recommendations.map((rec) => (
              <article className="recommend-card" key={rec.title}>
                <div>
                  <h2>{rec.title}</h2>
                  <p>{rec.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(rec.genres || []).map((genre) => (
                      <span className="genre-pill" key={genre}>
                        {genre}
                      </span>
                    ))}
                    <span className="genre-pill">{rec.episodes || "?"} eps</span>
                  </div>
                </div>
                <button className="secondary-button" type="button" onClick={() => addRecommendation(rec)}>
                  <PlusCircle size={17} /> Add to Watchlist
                </button>
              </article>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <button
              className="primary-button"
              type="button"
              onClick={() => requestRecommendations({ refresh: true })}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              Give Me New Ones
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ToggleGroup({ label, options, selected, onPick }) {
  return (
    <div className="field-label">
      {label}
      <div className="pill-grid">
        {options.map((option) => (
          <button
            className={`pill-toggle ${selected.includes(option) ? "pill-toggle--active" : ""}`}
            key={option}
            type="button"
            onClick={() => onPick(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
