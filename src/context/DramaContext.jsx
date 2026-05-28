import React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext.jsx";
import {
  isStoragePoster,
  removePosterFile,
  restDelete,
  restInsert,
  restSelect,
  restUpdate,
  uploadPosterFile,
} from "../lib/supabaseClient.js";

const BACKUP_VERSION = 2;
const DramaContext = createContext(null);

function makeId(title) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug || "drama"}-${Date.now().toString(36)}`;
}

function normalizeDrama(drama) {
  const now = new Date().toISOString();
  const normalized = {
    title: "",
    poster_url: "",
    genres: [],
    status: "Want to Watch",
    episodes: 0,
    priority: "Medium",
    notes: "",
    rating: null,
    date_started: "",
    date_completed: "",
    favorite_character: "",
    watch_mood: "",
    would_recommend: "",
    review: "",
    favorite_quote: "",
    emotional_impact: "",
    rewatchable: "",
    created_at: now,
    updated_at: now,
    ...drama,
  };
  return {
    ...normalized,
    id: normalized.id || makeId(normalized.title || "drama"),
    title: String(normalized.title || "Untitled Drama").trim(),
    genres: Array.isArray(normalized.genres) ? normalized.genres : [],
    episodes: Number(normalized.episodes || 0),
    rating: normalized.rating ? Number(normalized.rating) : null,
  };
}

function toDbDrama(drama, userId) {
  const normalized = normalizeDrama(drama);
  return {
    id: normalized.id,
    user_id: userId,
    title: normalized.title,
    poster_url: normalized.poster_url,
    genres: normalized.genres,
    status: normalized.status,
    episodes: normalized.episodes,
    priority: normalized.priority,
    notes: normalized.notes,
    rating: normalized.rating,
    date_started: normalized.date_started || null,
    date_completed: normalized.date_completed || null,
    favorite_character: normalized.favorite_character,
    watch_mood: normalized.watch_mood,
    would_recommend: normalized.would_recommend,
    review: normalized.review,
    favorite_quote: normalized.favorite_quote,
    emotional_impact: normalized.emotional_impact,
    rewatchable: normalized.rewatchable,
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
  };
}

function stripClientOnlyFields(drama) {
  const { poster_file, poster_preview_url, ...rest } = drama;
  return rest;
}

function fromDbDrama(row) {
  return normalizeDrama({
    ...row,
    date_started: row.date_started || "",
    date_completed: row.date_completed || "",
  });
}

export function DramaProvider({ children }) {
  const { accessToken, user, supabaseConfigured } = useAuth();
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDramas() {
      if (!user || !accessToken || !supabaseConfigured) {
        setDramas([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const rows = await restSelect("dramas", accessToken, "?select=*&order=updated_at.desc");
        if (!cancelled) setDramas(rows.map(fromDbDrama));
      } catch (error) {
        if (!cancelled) toast.error(error.message || "Could not load dramas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDramas();
    return () => {
      cancelled = true;
    };
  }, [accessToken, supabaseConfigured, user]);

  async function addDrama(input) {
    const now = new Date().toISOString();
    const drama = normalizeDrama(stripClientOnlyFields({
      ...input,
      id: input.id || makeId(input.title),
      created_at: input.created_at || now,
      updated_at: now,
    }));
    if (input.poster_file) {
      drama.poster_url = await uploadPosterFile(accessToken, input.poster_file, user.id, drama.id);
    }
    const [saved] = await restInsert("dramas", accessToken, toDbDrama(drama, user.id));
    const nextDrama = fromDbDrama(saved);
    setDramas((current) => [nextDrama, ...current]);
    toast.success(`${nextDrama.title} joined the diary.`);
    return nextDrama;
  }

  async function updateDrama(id, input) {
    const existing = dramas.find((drama) => drama.id === id);
    const payload = normalizeDrama(stripClientOnlyFields({ ...(existing || {}), ...input, id, updated_at: new Date().toISOString() }));
    if (input.poster_file) {
      payload.poster_url = await uploadPosterFile(accessToken, input.poster_file, user.id, id);
    }
    const [saved] = await restUpdate("dramas", accessToken, id, toDbDrama(payload, user.id));
    const nextDrama = fromDbDrama(saved);
    setDramas((current) => current.map((drama) => (drama.id === id ? nextDrama : drama)));
    toast.success(`${nextDrama.title} was updated.`);
    return nextDrama;
  }

  async function deleteDrama(id) {
    const drama = dramas.find((item) => item.id === id);
    await restDelete("dramas", accessToken, id);
    if (isStoragePoster(drama?.poster_url)) {
      try {
        await removePosterFile(accessToken, drama.poster_url);
      } catch {
        toast.error("Drama deleted, but the old poster file could not be removed.");
      }
    }
    setDramas((current) => current.filter((item) => item.id !== id));
    if (drama) toast.success(`${drama.title} left the watchlist.`);
  }

  function exportDramas() {
    return {
      app: "AshWatch",
      version: BACKUP_VERSION,
      exported_at: new Date().toISOString(),
      owner: user?.email || "",
      dramas,
    };
  }

  async function importDramas(backup) {
    const incoming = Array.isArray(backup) ? backup : backup?.dramas;
    if (!Array.isArray(incoming)) {
      throw new Error("This does not look like an AshWatch backup.");
    }
    const restored = [];
    for (const item of incoming) {
      const now = new Date().toISOString();
      const drama = normalizeDrama({ ...item, id: makeId(item.title || "drama"), created_at: now, updated_at: now });
      const [saved] = await restInsert("dramas", accessToken, toDbDrama(drama, user.id));
      restored.push(fromDbDrama(saved));
    }
    setDramas((current) => [...restored, ...current]);
    toast.success(`Restored ${restored.length} drama${restored.length === 1 ? "" : "s"}.`);
    return restored;
  }

  const value = useMemo(
    () => ({ dramas, loading, addDrama, updateDrama, deleteDrama, exportDramas, importDramas }),
    [dramas, loading],
  );

  return <DramaContext.Provider value={value}>{children}</DramaContext.Provider>;
}

export function useDramas() {
  const context = useContext(DramaContext);
  if (!context) throw new Error("useDramas must be used inside DramaProvider");
  return context;
}
