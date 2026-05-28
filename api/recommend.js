const CACHE_TTL_MS = 1000 * 60 * 20;
const recommendationCache = new Map();

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "The AI recommender is not configured yet. Add OPENAI_API_KEY in Vercel.",
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

    return res.json({ recommendations, cached: false });
  } catch (error) {
    return res.status(500).json({
      error:
        error.name === "AbortError"
          ? "Snoopy is taking longer than usual. Try again and the next attempt should be quicker."
          : "Snoopy could not fetch recommendations right now. Check your API key and try again.",
    });
  }
}
