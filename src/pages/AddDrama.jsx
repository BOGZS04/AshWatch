import React from "react";
import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LogoMark from "../components/LogoMark.jsx";
import PageHeader from "../components/PageHeader.jsx";
import PosterImage from "../components/PosterImage.jsx";
import { useDramas } from "../context/DramaContext.jsx";
import { GENRES, PRIORITIES, PRIORITY_LABELS, STATUSES } from "../data/constants.js";

const emptyDrama = {
  title: "",
  poster_url: "",
  genres: [],
  status: "Want to Watch",
  episodes: "",
  priority: "High",
  notes: "",
  rating: "",
  date_started: "",
  date_completed: "",
  favorite_character: "",
  watch_mood: "",
  would_recommend: "",
  review: "",
  favorite_quote: "",
  emotional_impact: "",
  rewatchable: "",
  poster_file: null,
  poster_preview_url: "",
};
const POSTER_MAX_BYTES = 250 * 1024;
const POSTER_WIDTH_STEPS = [760, 680, 600, 520, 440, 360, 300, 240, 200, 160, 128];
const POSTER_QUALITY_STEPS = [0.76, 0.68, 0.6, 0.52, 0.44, 0.36, 0.28, 0.22, 0.18, 0.14, 0.1];

export default function AddDrama() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dramas, addDrama, updateDrama } = useDramas();
  const existing = useMemo(() => dramas.find((drama) => drama.id === id), [dramas, id]);
  const [form, setForm] = useState(() => ({ ...emptyDrama, ...(existing || {}) }));
  const editing = Boolean(existing);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleGenre(genre) {
    setForm((current) => ({
      ...current,
      genres: current.genres.includes(genre)
        ? current.genres.filter((item) => item !== genre)
        : [...current.genres, genre],
    }));
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        image.onload = async () => {
          let smallestResult = null;
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Poster compression failed."));
            return;
          }

          for (const maxWidth of POSTER_WIDTH_STEPS) {
            const scale = Math.min(1, maxWidth / image.width);
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            for (const quality of POSTER_QUALITY_STEPS) {
              const blob = await new Promise((blobResolve) => canvas.toBlob(blobResolve, "image/webp", quality));
              if (!blob) continue;
              const result = {
                file: new File([blob], "poster.webp", { type: "image/webp" }),
                previewUrl: canvas.toDataURL("image/webp", quality),
                size: blob.size,
              };
              if (!smallestResult || blob.size < smallestResult.size) {
                smallestResult = result;
              }
              if (blob.size <= POSTER_MAX_BYTES) {
                resolve(result);
                return;
              }
            }
          }
          reject(new Error(`Poster is still ${Math.round((smallestResult?.size || file.size) / 1024)} KB after compression.`));
        };
        image.onerror = reject;
        image.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handlePoster(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setForm((current) => ({
        ...current,
        poster_file: compressed.file,
        poster_preview_url: compressed.previewUrl,
        poster_url: compressed.previewUrl,
      }));
    } catch (error) {
      window.alert(error?.message || "AshWatch could not process that poster. Try a different image.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      title: form.title.trim(),
      episodes: Number(form.episodes || 0),
      rating: form.status === "Completed" && form.rating ? Number(form.rating) : null,
      date_completed: form.status === "Completed" ? form.date_completed : "",
    };
    const drama = editing ? await updateDrama(existing.id, payload) : await addDrama(payload);
    navigate(`/drama/${drama.id}`);
  }

  return (
    <div>
      <PageHeader
        title={editing ? "Edit Drama" : "Add a Drama"}
        subtitle="Tell Snoopy about your next obsession."
        mascot={<LogoMark compact />}
      />

      <form className="form-panel" onSubmit={handleSubmit}>
        <label className="field-label">
          Title 📝*
          <input
            className="field"
            required
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </label>

        <label className="field-label">
          Poster 🖼️
          <input className="sr-only" type="file" accept="image/*" onChange={handlePoster} />
          <span className={form.poster_url ? "upload-box upload-box--preview" : "upload-box"}>
            {form.poster_preview_url ? (
              <img src={form.poster_preview_url} alt="Selected poster preview" />
            ) : form.poster_url ? (
              <PosterImage src={form.poster_url} alt="Selected poster preview" />
            ) : (
              "Click to upload a poster"
            )}
          </span>
        </label>

        <div className="field-label">
          Genres 🎭
          <div className="pill-grid">
            {GENRES.map((genre) => (
              <button
                className={`pill-toggle ${form.genres.includes(genre) ? "pill-toggle--active" : ""}`}
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="field-label">
            Status 📌
            <select className="field" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Date Started 📅
            <input
              className="field"
              type="date"
              value={form.date_started || ""}
              onChange={(event) => updateField("date_started", event.target.value)}
            />
          </label>
          <label className="field-label">
            Episodes 🎬
            <input
              className="field"
              min="0"
              type="number"
              value={form.episodes}
              onChange={(event) => updateField("episodes", event.target.value)}
            />
          </label>
          <div className="field-label">
            Priority 🚦
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((priority) => (
                <button
                  className={`pill-toggle ${form.priority === priority ? "pill-toggle--active" : ""}`}
                  key={priority}
                  type="button"
                  onClick={() => updateField("priority", priority)}
                >
                  {PRIORITY_LABELS[priority]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="field-label">
          Notes / Why I want to watch 💭
          <textarea
            className="field min-h-32"
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
          />
        </label>

        {form.status === "Completed" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label">
              Rating ⭐
              <div className="rating-picker" role="radiogroup" aria-label="Rating">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1;
                  const active = value <= Number(form.rating || 0);
                  return (
                    <button
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      aria-checked={Number(form.rating || 0) === value}
                      className={active ? "rating-star rating-star--active" : "rating-star"}
                      key={value}
                      onClick={() => updateField("rating", String(value))}
                      role="radio"
                      type="button"
                    >
                      <Star size={28} fill="currentColor" />
                    </button>
                  );
                })}
              </div>
            </label>
            <label className="field-label">
              Date Completed ✅
              <input
                className="field"
                type="date"
                value={form.date_completed || ""}
                onChange={(event) => updateField("date_completed", event.target.value)}
              />
            </label>
            <label className="field-label">
              Favorite character 👤
              <input
                className="field"
                value={form.favorite_character || ""}
                onChange={(event) => updateField("favorite_character", event.target.value)}
              />
            </label>
            <label className="field-label">
              This drama made me 💗
              <input
                className="field"
                value={form.watch_mood || ""}
                onChange={(event) => updateField("watch_mood", event.target.value)}
              />
            </label>
            <label className="field-label">
              Emotional impact ✨
              <input
                className="field"
                value={form.emotional_impact || ""}
                onChange={(event) => updateField("emotional_impact", event.target.value)}
                placeholder="e.g. Comforted, destroyed, obsessed"
              />
            </label>
            <label className="field-label">
              Rewatchable 🔁
              <select
                className="field"
                value={form.rewatchable || ""}
                onChange={(event) => updateField("rewatchable", event.target.value)}
              >
                <option value="">Not sure yet</option>
                <option>Yes</option>
                <option>Maybe</option>
                <option>No</option>
              </select>
            </label>
            <label className="field-label md:col-span-2">
              Would recommend 👍
              <input
                className="field"
                value={form.would_recommend || ""}
                onChange={(event) => updateField("would_recommend", event.target.value)}
              />
            </label>
            <label className="field-label md:col-span-2">
              Favorite quote 💬
              <input
                className="field"
                value={form.favorite_quote || ""}
                onChange={(event) => updateField("favorite_quote", event.target.value)}
              />
            </label>
            <label className="field-label md:col-span-2">
              Personal review 📝
              <textarea
                className="field min-h-32"
                value={form.review || ""}
                onChange={(event) => updateField("review", event.target.value)}
              />
            </label>
          </div>
        ) : null}

        <button className="primary-button w-full justify-center py-4" type="submit">
          {editing ? "Save drama" : "Add to my dramas"}
        </button>
      </form>
    </div>
  );
}
