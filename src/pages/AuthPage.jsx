import React from "react";
import { Eye, EyeOff, Film, KeyRound, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage({ mode }) {
  const creating = mode === "signup";
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, supabaseConfigured, user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={location.state?.from || "/"} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (creating) {
        await signUp({ email, password, displayName, inviteCode });
      } else {
        await signIn({ email, password });
      }
      navigate(location.state?.from || "/", { replace: true });
    } catch (authError) {
      setError(authError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-poster">
          <Film size={42} />
          <h1>AshWatch</h1>
          <p>Your private K-drama diary, now with accounts.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <p className="auth-kicker">{creating ? "Create account" : "Welcome back"}</p>
          <h2>{creating ? "Start your own diary" : "Log in to AshWatch"}</h2>

          {!supabaseConfigured ? (
            <div className="ai-error">
              Supabase is not configured yet. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.
            </div>
          ) : null}

          {creating ? (
            <label className="field-label">
              Display name
              <span className="auth-field">
                <UserRound size={18} />
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ashley" />
              </span>
            </label>
          ) : null}

          {creating ? (
            <label className="field-label">
              Invite code
              <span className="auth-field">
                <KeyRound size={18} />
                <input
                  required
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                  placeholder="ASHWATCH-2026"
                />
              </span>
            </label>
          ) : null}

          <label className="field-label">
            Email
            <span className="auth-field">
              <Mail size={18} />
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </span>
          </label>

          <label className="field-label">
            Password
            <span className="auth-field auth-field--password">
              <Lock size={18} />
              <input
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error ? <p className="ai-error">{error}</p> : null}

          <button className="primary-button w-full py-4" disabled={submitting || !supabaseConfigured} type="submit">
            {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
            {creating ? "Create Account" : "Log In"}
          </button>

          <p className="auth-switch">
            {creating ? "Already have an account?" : "Need an account?"}{" "}
            <Link to={creating ? "/login" : "/signup"}>{creating ? "Log in" : "Create one"}</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
