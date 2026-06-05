const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION_KEY = "ashwatch.supabase.session";
const REMEMBER_SESSION_KEY = "ashwatch.supabase.rememberSession";
const POSTER_BUCKET = "drama-posters";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function getEndpoint(path) {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.");
  }
  return `${SUPABASE_URL}${path}`;
}

function getStoredSession() {
  try {
    const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function readSession() {
  return getStoredSession();
}

export function readRememberSessionPreference() {
  return localStorage.getItem(REMEMBER_SESSION_KEY) !== "false";
}

export function saveSession(session, options = {}) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_SESSION_KEY);
    return;
  }
  const remember = options.remember ?? readRememberSessionPreference();
  localStorage.setItem(REMEMBER_SESSION_KEY, remember ? "true" : "false");
  if (remember) {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return;
  }
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function authHeaders(accessToken) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

function storageEndpoint(path) {
  return getEndpoint(`/storage/v1${path}`);
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(data?.error_description || data?.msg || data?.message || "Supabase request failed.");
  }
  return data;
}

export async function signUpWithPassword({ email, password, displayName }) {
  const response = await fetch(getEndpoint("/auth/v1/signup"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      password,
      data: { display_name: displayName || "" },
    }),
  });
  return parseResponse(response);
}

export function makeStoragePosterValue(path) {
  return `storage:${POSTER_BUCKET}/${path}`;
}

export function getStoragePosterPath(value) {
  const prefix = `storage:${POSTER_BUCKET}/`;
  return typeof value === "string" && value.startsWith(prefix) ? value.slice(prefix.length) : "";
}

export function isStoragePoster(value) {
  return Boolean(getStoragePosterPath(value));
}

export async function uploadPosterFile(accessToken, file, userId, dramaId) {
  if (!file) return "";
  const safeDramaId = String(dramaId || "poster").replace(/[^a-zA-Z0-9_-]+/g, "-");
  const path = `${userId}/${safeDramaId}.webp`;
  const response = await fetch(storageEndpoint(`/object/${POSTER_BUCKET}/${path}`), {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": file.type || "image/webp",
      "x-upsert": "true",
    },
    body: file,
  });
  await parseResponse(response);
  return makeStoragePosterValue(path);
}

export async function createPosterSignedUrl(accessToken, posterValue) {
  const path = getStoragePosterPath(posterValue);
  if (!path) return posterValue || "";
  const response = await fetch(storageEndpoint(`/object/sign/${POSTER_BUCKET}/${path}`), {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ expiresIn: 60 * 60 }),
  });
  const data = await parseResponse(response);
  return data?.signedURL ? `${SUPABASE_URL}/storage/v1${data.signedURL}` : "";
}

export async function removePosterFile(accessToken, posterValue) {
  const path = getStoragePosterPath(posterValue);
  if (!path) return;
  const response = await fetch(storageEndpoint(`/object/${POSTER_BUCKET}/${path}`), {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
  await parseResponse(response);
}

export async function signInWithPassword({ email, password }) {
  const response = await fetch(getEndpoint("/auth/v1/token?grant_type=password"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return parseResponse(response);
}

export async function refreshSession(refreshToken) {
  const response = await fetch(getEndpoint("/auth/v1/token?grant_type=refresh_token"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return parseResponse(response);
}

export async function signOutSession(accessToken) {
  if (!accessToken || !supabaseConfigured) return;
  await fetch(getEndpoint("/auth/v1/logout"), {
    method: "POST",
    headers: authHeaders(accessToken),
  });
}

export async function fetchCurrentUser(accessToken) {
  const response = await fetch(getEndpoint("/auth/v1/user"), {
    headers: authHeaders(accessToken),
  });
  return parseResponse(response);
}

export async function updateCurrentUser(accessToken, updates) {
  const response = await fetch(getEndpoint("/auth/v1/user"), {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify(updates),
  });
  return parseResponse(response);
}

export async function restSelect(table, accessToken, query = "") {
  const response = await fetch(getEndpoint(`/rest/v1/${table}${query}`), {
    headers: authHeaders(accessToken),
  });
  return parseResponse(response);
}

export async function restInsert(table, accessToken, row) {
  const response = await fetch(getEndpoint(`/rest/v1/${table}`), {
    method: "POST",
    headers: {
      ...authHeaders(accessToken),
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });
  return parseResponse(response);
}

export async function restUpsert(table, accessToken, row, conflictKey = "id") {
  const response = await fetch(getEndpoint(`/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictKey)}`), {
    method: "POST",
    headers: {
      ...authHeaders(accessToken),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(row),
  });
  return parseResponse(response);
}

export async function restUpdate(table, accessToken, id, row) {
  const response = await fetch(getEndpoint(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: {
      ...authHeaders(accessToken),
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });
  return parseResponse(response);
}

export async function restDelete(table, accessToken, id) {
  const response = await fetch(getEndpoint(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
  return parseResponse(response);
}
