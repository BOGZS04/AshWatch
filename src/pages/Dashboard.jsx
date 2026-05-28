import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo, useState } from "react";
import { CalendarDays, Clapperboard, Clock, Download, Flame, Heart, Sparkles, Star } from "lucide-react";
import DramaCard from "../components/DramaCard.jsx";
import LogoMark from "../components/LogoMark.jsx";
import PosterImage from "../components/PosterImage.jsx";
import RandomPickModal from "../components/RandomPickModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDramas } from "../context/DramaContext.jsx";
import { createPosterSignedUrl, isStoragePoster } from "../lib/supabaseClient.js";
import { genreBreakdown, getStats, monthlyCompletions } from "../utils/dramaMath.js";

const quotes = [
  ['"Don\'t be too kind. Being too kind hurts you."', "It's Okay to Not Be Okay"],
  ['"Whatever you decide, I\'ll support you."', "Reply 1988"],
  ['"Some things you only realize once they\'re gone."', "My Mister"],
];

export default function Dashboard() {
  const { accessToken, user } = useAuth();
  const { dramas } = useDramas();
  const [picked, setPicked] = useState(null);
  const stats = useMemo(() => getStats(dramas), [dramas]);
  const topRated = useMemo(
    () =>
      dramas
        .filter((drama) => drama.status === "Completed")
        .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
        .slice(0, 3),
    [dramas],
  );
  const posterStack = useMemo(
    () => dramas.filter((drama) => drama.poster_url).slice(0, 5),
    [dramas],
  );
  const favoriteDrama = topRated[0] || dramas[0];
  const quote = quotes[new Date().getDate() % quotes.length];
  const displayName = user?.user_metadata?.display_name || "Drama fan";
  const possessiveName = `${displayName}${displayName.toLowerCase().endsWith("s") ? "'" : "'s"}`;

  function pickDrama() {
    const candidates = dramas.filter((drama) => drama.status === "Want to Watch");
    if (!candidates.length) return;
    setPicked(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  function roundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
  }

  function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = 2) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    let lines = [];
    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (context.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });
    if (line) lines.push(line);
    lines = lines.slice(0, maxLines);
    lines.forEach((item, index) => context.fillText(item, x, y + index * lineHeight));
  }

  async function resolveCanvasImageSource(src) {
    if (!src) return "";
    if (isStoragePoster(src)) {
      return createPosterSignedUrl(accessToken, src);
    }
    return src;
  }

  async function loadCanvasImage(src) {
    const resolvedSrc = await resolveCanvasImageSource(src);
    return new Promise((resolve) => {
      if (!resolvedSrc) return resolve(null);
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = resolvedSrc;
    });
  }

  async function saveShareCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    const posterImage = await loadCanvasImage(favoriteDrama?.poster_url || "");
    const gradient = context.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, "#071827");
    gradient.addColorStop(0.44, "#1e3a8a");
    gradient.addColorStop(1, "#7c3aed");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1080, 1350);

    context.fillStyle = "rgba(125,211,252,0.34)";
    context.beginPath();
    context.arc(880, 170, 260, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255,126,182,0.26)";
    context.beginPath();
    context.arc(120, 1110, 310, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.13)";
    roundedRect(context, 72, 82, 936, 1188, 58);
    context.fillStyle = "rgba(255,255,255,0.16)";
    roundedRect(context, 102, 112, 876, 1128, 44);

    context.fillStyle = "#ffffff";
    context.font = "900 72px Quicksand, Arial, sans-serif";
    context.fillText("✨ AshWatch Wrapped", 130, 210);
    context.font = "800 30px Quicksand, Arial, sans-serif";
    context.fillStyle = "rgba(255,255,255,0.78)";
    drawWrappedText(context, `${possessiveName} K-drama diary card`, 132, 268, 640, 38, 2);

    context.fillStyle = "rgba(255,255,255,0.18)";
    roundedRect(context, 130, 342, 330, 495, 34);
    if (posterImage) {
      context.save();
      context.beginPath();
      context.roundRect(148, 360, 294, 459, 26);
      context.clip();
      const posterRatio = posterImage.width / posterImage.height;
      const targetRatio = 294 / 459;
      let sx = 0;
      let sy = 0;
      let sw = posterImage.width;
      let sh = posterImage.height;
      if (posterRatio > targetRatio) {
        sw = posterImage.height * targetRatio;
        sx = (posterImage.width - sw) / 2;
      } else {
        sh = posterImage.width / targetRatio;
        sy = (posterImage.height - sh) / 2;
      }
      context.drawImage(posterImage, sx, sy, sw, sh, 148, 360, 294, 459);
      context.restore();
    } else {
      const posterGradient = context.createLinearGradient(148, 360, 442, 819);
      posterGradient.addColorStop(0, "#8ecaff");
      posterGradient.addColorStop(1, "#ef7fa9");
      context.fillStyle = posterGradient;
      roundedRect(context, 148, 360, 294, 459, 26);
      context.fillStyle = "rgba(7,24,39,0.3)";
      roundedRect(context, 176, 646, 238, 112, 24);
      context.fillStyle = "#ffffff";
      context.font = "900 56px Quicksand, Arial, sans-serif";
      context.fillText("🎬", 242, 565);
      context.font = "900 30px Quicksand, Arial, sans-serif";
      drawWrappedText(context, favoriteDrama?.title || "Still choosing", 196, 692, 198, 36, 2);
    }

    const rows = [
      ["💖 Favorite Drama", favoriteDrama?.title || "Still choosing"],
      ["🎭 Favorite Genre", stats.topGenre || "Not enough data"],
      ["✅ Completed", `${stats.completed} dramas`],
      ["⏳ Hours Watched", `${stats.totalHours} hrs`],
      ["⭐ Average Rating", `${stats.avgRating}/5`],
      ["🔥 Top Mood", "Obsessed"],
    ];

    rows.forEach(([label, value], index) => {
      const y = 372 + index * 86;
      context.fillStyle = index % 2 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.22)";
      roundedRect(context, 500, y - 38, 430, 68, 24);
      context.fillStyle = "rgba(255,255,255,0.65)";
      context.font = "800 20px Quicksand, Arial, sans-serif";
      context.fillText(label, 528, y - 10);
      context.fillStyle = "#ffffff";
      context.font = "900 30px Quicksand, Arial, sans-serif";
      drawWrappedText(context, value, 528, y + 23, 360, 32, 1);
    });

    context.fillStyle = "rgba(255,255,255,0.18)";
    roundedRect(context, 130, 900, 800, 172, 34);
    context.fillStyle = "#ffffff";
    context.font = "900 34px Quicksand, Arial, sans-serif";
    context.fillText("Current drama era", 172, 960);
    context.font = "800 29px Quicksand, Arial, sans-serif";
    context.fillStyle = "rgba(255,255,255,0.78)";
    drawWrappedText(
      context,
      `${displayName} has watched ${stats.totalHours} hours and is clearly in their main-character K-drama season.`,
      172,
      1010,
      720,
      40,
      2,
    );

    context.fillStyle = "rgba(255,255,255,0.82)";
    context.font = "900 28px Quicksand, Arial, sans-serif";
    context.fillText("Made in AshWatch • private drama diary", 130, 1168);
    context.fillStyle = "rgba(255,255,255,0.5)";
    context.font = "800 22px Quicksand, Arial, sans-serif";
    context.fillText("Share with friends, compare eras, pick the next obsession.", 130, 1210);

    const link = document.createElement("a");
    link.download = "ashwatch-share-card.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero hero-panel">
        <div className="dashboard-hero-top">
          <div className="flex min-w-0 items-center gap-5">
            <div className="header-mascot">
              <LogoMark compact />
            </div>
            <div>
              <h1 className="font-display text-3xl font-black text-[var(--brand)] sm:text-4xl">Hi {displayName}!</h1>
              <p className="mt-1 text-[var(--muted)]">What are we watching today?</p>
              <div className="quote-box">
                <p>{quote[0]}</p>
                <span>- {quote[1]}</span>
              </div>
            </div>
          </div>
          <button className="primary-button" type="button" onClick={pickDrama}>
            Pick My Next Drama
          </button>
        </div>
        <div className="cinema-poster-stack" aria-label="Featured dramas">
          {posterStack.map((drama, index) => (
            <PosterImage
              alt=""
              className={`cinema-poster-stack__item cinema-poster-stack__item--${index + 1}`}
              key={drama.id}
              src={drama.poster_url}
            />
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <MiniStat icon={Flame} label="No streak yet" value="Start watching!" tone="warm" />
        <MiniStat icon={Clock} label="Drama waiting" value={`${stats.watchlistHours} hrs`} tone="cool" />
      </section>

      <section className="mt-6 dashboard-band dashboard-band--month">
        <h2><CalendarDays size={20} /> May So Far...</h2>
        <div className="dashboard-band-grid">
          <StatCard label="Dramas finished" value={stats.completedThisMonth} />
          <StatCard label="Hours watched" value={`${stats.monthHours} hrs`} />
          <StatCard label="Favorite genre" value={stats.topGenre} />
          <StatCard label="Highest rated" value={stats.highestRated} />
          <StatCard label="Top mood" value="Obsessed" />
        </div>
      </section>

      <section className="mt-6 dashboard-band dashboard-band--review">
        <h2><Sparkles size={20} /> {possessiveName} 2026 in Review</h2>
        <div className="dashboard-band-grid">
          <StatCard label="Dramas finished" value={stats.completed} />
          <StatCard label="Hours watched" value={`${stats.totalHours} hrs`} />
          <StatCard label="Favorite genre" value={stats.topGenre} />
          <StatCard label="Highest rated" value={stats.highestRated} />
          <StatCard label="Top mood" value="Obsessed" />
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BigMetric value={stats.completedThisMonth} label="Watched this month" icon={Clapperboard} />
        <BigMetric value={stats.monthHours} label="Episodes this month" icon={Clock} />
        <BigMetric value={stats.avgRating} label="Avg rating this month" icon={Star} />
        <BigMetric value={stats.completed} label="Total dramas completed" icon={Sparkles} />
        <BigMetric value={stats.topGenre} label="Favorite genre" icon={Heart} />
        <BigMetric value={`${stats.totalHours}h`} label="Est. total hours" icon={Clock} />
        <BigMetric value={stats.current} label="Currently watching" icon={Clapperboard} />
        <BigMetric value={stats.want} label="Want to watch" icon={Sparkles} />
      </section>

      <section className="share-card-section mt-8">
        <div className="share-card-copy">
          <p>Shareable diary card</p>
          <h2>{possessiveName} Drama Card</h2>
          <span>Built for screenshots, stories, and sending your current drama era to friends.</span>
        </div>
        <div className="share-card-preview">
          <div className="share-card-preview__poster">
            {favoriteDrama?.poster_url ? <PosterImage src={favoriteDrama.poster_url} alt="" /> : <Sparkles size={42} />}
          </div>
          <div>
            <p>Favorite Drama</p>
            <h3>{favoriteDrama?.title || "Still choosing"}</h3>
            <div className="share-card-stats">
              <span>{stats.topGenre} fan</span>
              <span>{stats.completed} completed</span>
              <span>{stats.totalHours} hrs watched</span>
            </div>
          </div>
        </div>
        <button className="primary-button" type="button" onClick={saveShareCard}>
          <Download size={18} /> Save My Drama Card
        </button>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-black text-[var(--heading)]">Top 3 rated</h2>
        <div className="poster-grid poster-grid--top">
          {topRated.map((drama) => (
            <DramaCard key={drama.id} drama={drama} compact />
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Dramas finished - last 6 months" data={monthlyCompletions(dramas)} xKey="month" yKey="count" />
        <ChartPanel title="Genre breakdown" data={genreBreakdown(dramas)} xKey="genre" yKey="count" />
      </section>

      <RandomPickModal drama={picked} onClose={() => setPicked(null)} />
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tone }) {
  return (
    <div className={`mini-stat mini-stat--${tone}`}>
      <Icon size={34} />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function BigMetric({ icon: Icon, label, value }) {
  return (
    <div className="metric-card">
      <Icon size={22} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ChartPanel({ title, data, xKey, yKey }) {
  return (
    <div className="chart-panel">
      <h3>{title}</h3>
      <div className="h-72 min-h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 12, left: -20, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey={xKey} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid var(--line)" }} />
            <Bar dataKey={yKey} fill="var(--accent)" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
