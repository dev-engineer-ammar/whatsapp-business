import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function Login() {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(username, password);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-header">
          <div className="login-mark">
            <ShieldCheck size={22} />
          </div>
          <div className="login-secure-note">
            <LockKeyhole size={15} />
            Cookie-secured session
          </div>
        </div>
        <p className="eyebrow">Secure access</p>
        <h1>Welcome back</h1>
        <p className="login-copy">
          Sign in to manage WhatsApp orders, payments, and catalog products from one focused workspace.
        </p>
        <form onSubmit={submit}>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <button type="submit" disabled={loading}>{loading ? "Signing in" : "Sign in"}</button>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
        <div className="login-footer">
          <span>Need to set credentials?</span>
          <Link className="auth-link" to="/register">Admin setup</Link>
        </div>
      </section>
    </main>
  );
}
