import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.RECOMMEND_PORT || 8787);

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

const CACHE_TTL_MS = 1000 * 60 * 20;
const recommendationCache = new Map();
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function hasSupabaseAdmin() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function supabaseAdminFetch(path, options = {}) {
  if (!hasSupabaseAdmin()) {
    throw new Error("Supabase admin environment variables are missing.");
  }
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(data?.message || data?.msg || data?.error_description || "Supabase request failed.");
  }
  return data;
}

function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function makeCacheKey(input) {
  return JSON.stringify({
    mood: input.mood,
    length: input.length,
    genres: [...input.genres].sort(),
    recentlyLoved: input.recentlyLoved.trim().toLowerCase(),
    watchedDramas: input.watchedDramas.map(normalizeTitle).sort(),
    previousRecommendations: input.previousRecommendations.map(normalizeTitle).sort(),
  });
}

function sanitizeRecommendations(items, blockedTitles) {
  const blocked = new Set(blockedTitles.map(normalizeTitle));
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      title: String(item.title || "").trim(),
      reason: String(item.reason || "").trim(),
      genres: Array.isArray(item.genres) ? item.genres.slice(0, 3).map(String) : [],
      episodes: Number.isFinite(Number(item.episodes)) ? Number(item.episodes) : null,
    }))
    .filter((item) => {
      const key = normalizeTitle(item.title);
      if (!key || blocked.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

app.post("/api/invite/validate", async (req, res) => {
  if (!hasSupabaseAdmin()) {
    return res.status(500).json({ error: "Invite checking is not configured yet." });
  }
  const code = String(req.body?.code || "").trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ error: "Enter an invite code to create an account." });
  }

  try {
    const rows = await supabaseAdminFetch(
      `/rest/v1/invite_codes?code=eq.${encodeURIComponent(code)}&select=code,label,max_uses,used_count,active`,
    );
    const invite = rows?.[0];
    if (!invite) return res.status(404).json({ error: "That invite code does not exist." });
    if (!invite.active) return res.status(403).json({ error: "That invite code is not active anymore." });
    if (Number(invite.used_count) >= Number(invite.max_uses)) {
      return res.status(403).json({ error: "That invite code has already been fully used." });
    }
    return res.json({ ok: true, label: invite.label || "" });
  } catch {
    return res.status(500).json({ error: "Could not check that invite code. Try again in a moment." });
  }
});

app.post("/api/invite/consume", async (req, res) => {
  if (!hasSupabaseAdmin()) {
    return res.status(500).json({ error: "Invite tracking is not configured yet." });
  }
  const authorization = req.headers.authorization || "";
  const code = String(req.body?.code || "").trim().toUpperCase();
  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in before using an invite code." });
  }
  if (!code) {
    return res.status(400).json({ error: "Invite code is required." });
  }

  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: authorization,
      },
    });
    const user = await readJson(userResponse);
    if (!userResponse.ok || !user?.id) {
      return res.status(401).json({ error: "Could not verify the signed-in account." });
    }
    const result = await supabaseAdminFetch("/rest/v1/rpc/consume_invite_code", {
      method: "POST",
      body: JSON.stringify({ invite_code: code }),
    });
    if (!result?.ok) {
      return res.status(403).json({ error: result?.error || "That invite code cannot be used." });
    }
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Could not mark that invite code as used." });
  }
});

app.post("/api/recommend", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY. Add it to your local .env file and restart the app.",
    });
  }

  const {
    mood,
    length,
    genres = [],
    recentlyLoved = "",
    watchedDramas = [],
    previousRecommendations = [],
  } = req.body || {};

  if (!mood || !length) {
    return res.status(400).json({ error: "Mood and preferred length are required." });
  }

  try {
    const cacheInput = { mood, length, genres, recentlyLoved, watchedDramas, previousRecommendations };
    const cacheKey = makeCacheKey(cacheInput);
    const cached = recommendationCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      return res.json({ recommendations: cached.recommendations, cached: true });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              'Return only compact JSON: {"recommendations":[{"title":"","reason":"","genres":[],"episodes":16}]}. Give exactly 10 unique K-dramas. Reasons must be warm and 18 words max. Genres max 3.',
          },
          {
            role: "user",
            content: [
              `Mood=${mood}`,
              `Length=${length}`,
              `Genres=${genres.length ? genres.join(",") : "any"}`,
              recentlyLoved ? `Loved=${recentlyLoved}` : "",
              watchedDramas.length ? `Exclude tracked=${watchedDramas.join("|")}` : "",
              previousRecommendations.length ? `Exclude previous=${previousRecommendations.join("|")}` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 900,
        temperature: 0.58,
      }),
    });
    clearTimeout(timeout);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI request failed.");
    }
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    const recommendations = sanitizeRecommendations(parsed.recommendations, [
      ...watchedDramas,
      ...previousRecommendations,
    ]);

    if (!recommendations.length) {
      throw new Error("OpenAI returned no usable recommendations.");
    }

    recommendationCache.set(cacheKey, { createdAt: Date.now(), recommendations });
    if (recommendationCache.size > 50) {
      const oldest = recommendationCache.keys().next().value;
      recommendationCache.delete(oldest);
    }

    res.json({ recommendations, cached: false });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({
      error:
        error.name === "AbortError"
          ? "Snoopy is taking longer than usual. Try again and the next attempt should be quicker."
          : "Snoopy could not fetch recommendations right now. Check your API key and try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`AshWatch recommendation API running at http://localhost:${port}`);
});
