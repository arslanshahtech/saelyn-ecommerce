import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { submitNewPassword } from "../../api/auth";
import "../AuthPage/AuthPage.css";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("Reset link mein token missing hai. Naya reset link request karein.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("Password 8 se 128 characters ke darmiyan hona chahiye.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Dono passwords match nahi karte.");
      return;
    }

    setBusy(true);
    try {
      const result = await submitNewPassword(token, password);
      setSuccess(result.message || "Password updated. Ab naye password se login karein.");
      setPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(requestError.message || "Password reset nahi ho saka.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">SAELYN ACCOUNT</p>
        <h1>Set New Password</h1>
        <p className="auth-intro">Naya strong password choose karein. Reset link sirf ek martaba aur 30 minutes tak valid hota hai.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>
            New password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required />
          </label>
          <label>
            Confirm new password
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {success && <p className="auth-success" role="status">{success}</p>}
          {!success && <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Updating…" : "Update Password"}</button>}
        </form>
        {success ? <p className="auth-switch"><Link to="/login">Go to Log In</Link></p> : <p className="auth-switch"><Link to="/forgot-password">Request a new reset link</Link></p>}
        <Link className="auth-back" to="/shop">Continue shopping</Link>
      </section>
    </main>
  );
}
