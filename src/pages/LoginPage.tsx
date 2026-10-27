import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getSocialLoginUrl } from "../api/endpoints";
import { Banner } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("error") ?? "");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    const fromState = (location.state as { from?: string } | null)?.from;
    return fromState && fromState !== "/login" ? fromState : "/";
  }, [location.state]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card auth-card">
      <h1>Log in</h1>
      <p className="muted">Use your customer account. Session cookies are set by the backend.</p>
      {error ? <Banner kind="error">{error}</Banner> : null}
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p>
        New here? <Link to="/signup">Create an account</Link>
      </p>
      <div className="row-gap">
        <a className="button secondary" href={getSocialLoginUrl("google")}>
          Continue with Google
        </a>
        <a className="button secondary" href={getSocialLoginUrl("facebook")}>
          Continue with Facebook
        </a>
      </div>
    </section>
  );
}
