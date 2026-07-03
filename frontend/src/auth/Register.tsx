import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export function Register() {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-mark">
          <ShieldCheck size={22} />
        </div>
        <p className="eyebrow">Admin setup</p>
        <h1>Create admin access</h1>
        <p className="helper-text">
          This project keeps admin credentials in backend environment variables. Set{" "}
          <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD</code>, and{" "}
          <code>ADMIN_SESSION_SECRET</code> in <code>backend/.env</code>.
        </p>
        <Link className="auth-link" to="/login">Back to login</Link>
      </section>
    </main>
  );
}
