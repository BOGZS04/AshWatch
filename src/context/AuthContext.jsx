import React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  fetchCurrentUser,
  readSession,
  restUpsert,
  saveSession,
  signInWithPassword,
  signOutSession,
  signUpWithPassword,
  supabaseConfigured,
  updateCurrentUser,
} from "../lib/supabaseClient.js";

const AuthContext = createContext(null);
const PENDING_INVITE_KEY = "ashwatch.pendingInviteCode";

async function postInvite(path, body, accessToken = "") {
  const apiBase = import.meta.env.VITE_APP_API_URL || (import.meta.env.DEV ? "http://localhost:8787" : "");
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Invite code request failed.");
  }
  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const [user, setUser] = useState(() => readSession()?.user || null);
  const [loading, setLoading] = useState(true);

  async function ensureProfile(accessToken, currentUser, displayName = "") {
    if (!accessToken || !currentUser?.id) return;
    await restUpsert("profiles", accessToken, {
      id: currentUser.id,
      display_name: displayName || currentUser.user_metadata?.display_name || "",
      updated_at: new Date().toISOString(),
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreUser() {
      if (!session?.access_token || !supabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await fetchCurrentUser(session.access_token);
        if (cancelled) return;
        const nextSession = { ...session, user: currentUser };
        await ensureProfile(session.access_token, currentUser);
        setUser(currentUser);
        setSession(nextSession);
        saveSession(nextSession);
      } catch {
        if (cancelled) return;
        setSession(null);
        setUser(null);
        saveSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreUser();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signUp({ email, password, displayName, inviteCode }) {
    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    if (!normalizedInviteCode) {
      throw new Error("Enter an invite code to create an account.");
    }
    await postInvite("/api/invite/validate", { code: normalizedInviteCode });
    const data = await signUpWithPassword({ email, password, displayName });
    if (data.access_token) {
      const nextSession = { ...data, user: data.user };
      await ensureProfile(data.access_token, data.user, displayName);
      await postInvite("/api/invite/consume", { code: normalizedInviteCode }, data.access_token);
      setSession(nextSession);
      setUser(data.user);
      saveSession(nextSession);
      toast.success("Welcome to AshWatch.");
      return data.user;
    }
    localStorage.setItem(PENDING_INVITE_KEY, normalizedInviteCode);
    toast.success("Account created. Check your email if confirmation is enabled.");
    return data.user;
  }

  async function signIn({ email, password }) {
    const data = await signInWithPassword({ email, password });
    const nextSession = { ...data, user: data.user };
    await ensureProfile(data.access_token, data.user);
    const pendingInviteCode = localStorage.getItem(PENDING_INVITE_KEY);
    if (pendingInviteCode) {
      await postInvite("/api/invite/consume", { code: pendingInviteCode }, data.access_token);
      localStorage.removeItem(PENDING_INVITE_KEY);
    }
    setSession(nextSession);
    setUser(data.user);
    saveSession(nextSession);
    toast.success("Welcome back.");
    return data.user;
  }

  async function signOut() {
    await signOutSession(session?.access_token);
    setSession(null);
    setUser(null);
    saveSession(null);
    toast.success("Signed out.");
  }

  async function updateDisplayName(displayName) {
    const nextName = displayName.trim();
    if (!session?.access_token || !user?.id) {
      throw new Error("You need to be signed in to update your display name.");
    }
    if (!nextName) {
      throw new Error("Display name cannot be empty.");
    }

    const updatedUser = await updateCurrentUser(session.access_token, {
      data: {
        ...(user.user_metadata || {}),
        display_name: nextName,
      },
    });
    await ensureProfile(session.access_token, updatedUser, nextName);
    const nextSession = { ...session, user: updatedUser };
    setUser(updatedUser);
    setSession(nextSession);
    saveSession(nextSession);
    toast.success("Display name updated.");
    return updatedUser;
  }

  async function updatePassword(password) {
    if (!session?.access_token) {
      throw new Error("You need to be signed in to update your password.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const updatedUser = await updateCurrentUser(session.access_token, { password });
    const nextSession = { ...session, user: updatedUser };
    setUser(updatedUser);
    setSession(nextSession);
    saveSession(nextSession);
    toast.success("Password updated.");
    return updatedUser;
  }

  const value = useMemo(
    () => ({
      accessToken: session?.access_token || "",
      loading,
      session,
      signIn,
      signOut,
      signUp,
      supabaseConfigured,
      updateDisplayName,
      updatePassword,
      user,
    }),
    [loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
