import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AuthPage.css";

export default function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const { user, authLoading, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (authLoading) {
    return <main className="auth-page"><p className="auth-status">Checking your account…</p></main>;
  }
  if (user) return <Navigate to="/account" replace />;

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password kam az kam 8 characters ka hona chahiye.");
      return;
    }
    setBusy(true);
    try {
      if (isRegister) {
        await register({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      } else {
        await login({ email: form.email, password: form.password });
      }
      const destination = location.state?.from || "/account";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Request complete nahi ho saki.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">SAELYN ACCOUNT</p>
        <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>
        <p className="auth-intro">
          {isRegister ? "Create your account to keep your details and saved pieces together." : "Log in to access your SAELYN account and saved details."}
        </p>

        <form className="auth-form" onSubmit={submit}>
          {isRegister && (
            <label>
              Full name
              <input name="name" value={form.name} onChange={update} autoComplete="name" minLength={2} maxLength={100} required />
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" value={form.email} onChange={update} autoComplete="email" maxLength={254} required />
          </label>
          {isRegister && (
            <label>
              Phone number <span className="auth-optional">(optional)</span>
              <input name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" maxLength={30} />
            </label>
          )}
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={update} autoComplete={isRegister ? "new-password" : "current-password"} minLength={8} maxLength={128} required />
            {isRegister && <span className="auth-hint">Use at least 8 characters.</span>}
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : isRegister ? "Create Account" : "Log In"}
          </button>
        </form>

        {!isRegister && <p className="auth-switch"><Link to="/forgot-password">Forgot your password?</Link></p>}
        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to SAELYN?"}{" "}
          <Link to={isRegister ? "/login" : "/register"} state={location.state}>{isRegister ? "Log in" : "Create an account"}</Link>
        </p>
        <Link className="auth-back" to="/shop">Continue shopping</Link>
      </section>
    </main>
  );
}
