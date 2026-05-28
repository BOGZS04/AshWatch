import { hasSupabaseAdmin, supabaseAdminFetch } from "../_supabase.js";

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!hasSupabaseAdmin()) {
    return res.status(500).json({ error: "Invite checking is not configured yet." });
  }

  const code = normalizeCode(req.body?.code);
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
}
