export function hoursForDrama(drama) {
  return Number(drama.episodes || 0);
}

export function formatDate(value) {
  if (!value) return "Not finished yet";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}

export function getStats(dramas) {
  const completed = dramas.filter((drama) => drama.status === "Completed");
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const completedThisMonth = completed.filter((drama) => {
    const date = new Date(drama.date_completed || drama.updated_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const genreCounts = countGenres(completed.length ? completed : dramas);
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Romance";
  const highest = [...completed].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))[0];
  const totalHours = completed.reduce((sum, drama) => sum + hoursForDrama(drama), 0);
  const monthHours = completedThisMonth.reduce((sum, drama) => sum + hoursForDrama(drama), 0);
  const avgRating =
    completedThisMonth.length > 0
      ? completedThisMonth.reduce((sum, drama) => sum + Number(drama.rating || 0), 0) /
        completedThisMonth.length
      : 0;

  return {
    total: dramas.length,
    completed: completed.length,
    current: dramas.filter((drama) => drama.status === "Currently Watching").length,
    want: dramas.filter((drama) => drama.status === "Want to Watch").length,
    dropped: dramas.filter((drama) => drama.status === "Dropped").length,
    completedThisMonth: completedThisMonth.length,
    monthHours,
    totalHours,
    topGenre,
    highestRated: highest ? `${highest.title} (${highest.rating}★)` : "Not yet",
    avgRating: avgRating ? avgRating.toFixed(1) : "0",
    watchlistHours: dramas
      .filter((drama) => drama.status === "Want to Watch")
      .reduce((sum, drama) => sum + hoursForDrama(drama), 0),
  };
}

export function countGenres(dramas) {
  return dramas.reduce((counts, drama) => {
    (drama.genres || []).forEach((genre) => {
      counts[genre] = (counts[genre] || 0) + 1;
    });
    return counts;
  }, {});
}

export function monthlyCompletions(dramas) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const month = date.toLocaleString("en", { month: "short" });
    const count = dramas.filter((drama) => {
      if (drama.status !== "Completed" || !drama.date_completed) return false;
      const done = new Date(drama.date_completed);
      return done.getMonth() === date.getMonth() && done.getFullYear() === date.getFullYear();
    }).length;
    return { month, count };
  });
}

export function genreBreakdown(dramas) {
  return Object.entries(countGenres(dramas))
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 9);
}

export function sortByPriority(a, b) {
  const order = { High: 0, Medium: 1, Low: 2 };
  return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
}
