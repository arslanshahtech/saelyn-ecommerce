import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../api/auth";
import "../AuthPage/AuthPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [developmentResetUrl, setDevelopmentResetUrl] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    setDevelopmentResetUrl("");
    try {
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message || "If an account exists for that email, a reset link will be sent shortly.");
      setDevelopmentResetUrl(result.developmentResetUrl || "");
    } catch (requestError) {
      setError(requestError.message || "Request complete nahi ho saki.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">SAELYN ACCOUNT</p>
        <h1>Forgot Password</h1>
        <p className="auth-intro">Apne account ka email enter karein. Agar account maujood hai to password reset karne ka link mil jayega.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>
            Email address
            <input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} required />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}
          {developmentResetUrl && (
            <div className="auth-dev-reset">
              <p>Local development link (sirf testing ke liye):</p>
              <a href={developmentResetUrl}>Open password reset page</a>
            </div>
          )}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : "Send Reset Link"}
          </button>
        </form>
        <p className="auth-switch"><Link to="/login">Back to Log In</Link></p>
        <Link className="auth-back" to="/shop">Continue shopping</Link>
      </section>
    </main>
  );
}
