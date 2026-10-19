import "../Auth.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", form);
      const data = response.data;

      const token =
        data.token ||
        data.accessToken ||
        data.jwt;

      if (!token) {
        setError("Login succeeded, but no authentication token was returned.");
        return;
      }

      localStorage.setItem("spendwise_token", token);

      if (data.user) {
        localStorage.setItem("spendwise_user", JSON.stringify(data.user));
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to sign in. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/login" className="auth-brand">
          <span className="auth-brand-mark">◇</span>
          <span>
            <strong>SpendWise</strong>
            <small>Your Money, Your Control</small>
          </span>
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">WELCOME BACK</span>
          <h1>Good to see you again.</h1>
          <p>Sign in to manage your money and track your financial progress.</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account?</span>
          <Link to="/register">Create an account</Link>
        </div>

        <p className="auth-security">
          <span aria-hidden="true">✦</span> Your financial information stays private.
        </p>
      </section>
    </main>
  );
}

export default Login;
