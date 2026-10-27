import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { resendOtp, verifyOtp } from "../api/endpoints";
import { Banner } from "../components/Feedback";
import { useAuth } from "../context/AuthContext";

export function VerifyOtpPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    (location.state as { message?: string } | null)?.message ?? "",
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await verifyOtp(email, token);
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError("");
    try {
      const result = await resendOtp(email);
      setInfo(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    }
  }

  return (
    <section className="card auth-card">
      <h1>Verify email</h1>
      {info ? <Banner kind="info">{info}</Banner> : null}
      {error ? <Banner kind="error">{error}</Banner> : null}
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          6-digit code
          <input
            required
            pattern="\d{6}"
            maxLength={6}
            inputMode="numeric"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Verifying…" : "Verify and log in"}
        </button>
      </form>
      <button type="button" className="linkish" onClick={() => void onResend()}>
        Resend code
      </button>
      <p>
        <Link to="/login">Back to login</Link>
      </p>
    </section>
  );
}
