import React from "react";
import { Copy, Eye, EyeOff, KeyRound, Loader2, LogOut, Mail, Save, ShieldCheck, Ticket, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDramas } from "../context/DramaContext.jsx";

export default function Account() {
  const navigate = useNavigate();
  const { signOut, updateDisplayName, updatePassword, user } = useAuth();
  const { dramas } = useDramas();
  const displayName = user?.user_metadata?.display_name || "AshWatch user";
  const inviteCode = "ASHWATCH-2026";
  const [nameInput, setNameInput] = useState(displayName);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setNameInput(displayName);
  }, [displayName]);

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  async function handleNameSubmit(event) {
    event.preventDefault();
    setSavingName(true);
    setNameError("");
    try {
      await updateDisplayName(nameInput);
    } catch (error) {
      setNameError(error.message);
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError("");
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setShowPassword(false);
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleCopyInvite() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success("Invite code copied.");
    } catch {
      toast.error("Could not copy the invite code.");
    }
  }

  return (
    <div>
      <PageHeader title="Account" subtitle="Manage your AshWatch profile and session." />

      <section className="account-panel">
        <div className="account-avatar">
          <UserRound size={38} />
        </div>
        <div>
          <p className="auth-kicker">Signed in as</p>
          <h2>{displayName}</h2>
          <div className="account-list">
            <span><Mail size={18} /> {user?.email}</span>
            <span><ShieldCheck size={18} /> Private user-owned diary</span>
            <span>{dramas.length} drama{dramas.length === 1 ? "" : "s"} saved</span>
          </div>
        </div>
        <button className="danger-button" type="button" onClick={handleSignOut}>
          <LogOut size={18} /> Log Out
        </button>
      </section>

      <section className="account-settings-grid">
        <form className="account-settings-card" onSubmit={handleNameSubmit}>
          <div>
            <p className="auth-kicker">Profile</p>
            <h3>Display name</h3>
          </div>
          <label className="field-label">
            Name
            <span className="auth-field">
              <UserRound size={18} />
              <input
                required
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Your name"
              />
            </span>
          </label>
          {nameError ? <p className="ai-error">{nameError}</p> : null}
          <button className="primary-button" disabled={savingName} type="submit">
            {savingName ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Name
          </button>
        </form>

        <form className="account-settings-card" onSubmit={handlePasswordSubmit}>
          <div>
            <p className="auth-kicker">Security</p>
            <h3>Change password</h3>
          </div>
          <label className="field-label">
            New password
            <span className="auth-field auth-field--password">
              <KeyRound size={18} />
              <input
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
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
          {passwordError ? <p className="ai-error">{passwordError}</p> : null}
          <button className="primary-button" disabled={savingPassword} type="submit">
            {savingPassword ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
            Update Password
          </button>
        </form>
      </section>

      <section className="account-settings-card account-invite-card">
        <div>
          <p className="auth-kicker">Invite friends</p>
          <h3>Share AshWatch</h3>
        </div>
        <div className="invite-code-box">
          <Ticket size={22} />
          <span>{inviteCode}</span>
        </div>
        <p className="account-helper-text">
          Send this code to trusted testers so they can create their own private drama diary.
        </p>
        <button className="primary-button" type="button" onClick={handleCopyInvite}>
          <Copy size={18} /> Copy Invite Code
        </button>
      </section>
    </div>
  );
}
