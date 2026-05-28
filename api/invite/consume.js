import { hasSupabaseAdmin, readJson, supabaseAdminFetch } from "../_supabase.js";

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!hasSupabaseAdmin()) {
    return res.status(500).json({ error: "Invite tracking is not configured yet." });
  }

  const authorization = req.headers.authorization || "";
  const code = normalizeCode(req.body?.code);
  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in before using an invite code." });
  }
  if (!code) {
    return res.status(400).json({ error: "Invite code is required." });
  }

  try {
    const userResponse = await fetch(`${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
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
}
