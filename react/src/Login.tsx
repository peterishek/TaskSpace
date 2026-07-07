import { useState, FormEvent } from "react";
import { login } from "./api";

interface LoginProps {
  onSuccess: () => void;
  goToSignup: () => void;
}

export default function Login({ onSuccess, goToSignup }: LoginProps) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>✅</div>
          <h1 style={styles.appName}>TaskSpace</h1>
        </div>

        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Sign in to continue managing your tasks</p>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.primaryButton}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{" "}
          <button type="button" onClick={goToSignup} style={styles.linkButton}>
            Create one now
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--body)",
    padding: "1rem",
    boxSizing: "border-box" as const,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "3rem 2.5rem",
    borderRadius: "24px",
    boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)",
    width: "100%",
    maxWidth: "420px",
    boxSizing: "border-box" as const,
    border: "1px solid #f1f5f9",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "2rem",
  },
  logoIcon: {
    fontSize: "2.25rem",
    lineHeight: 1,
  },
  appName: {
    margin: 0,
    fontFamily: "var(--heading)",
    fontSize: "2rem",
    fontWeight: 800,
    background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.02em",
  },
  title: {
    margin: "0 0 0.5rem 0",
    fontFamily: "var(--heading)",
    color: "#0f172a",
    fontSize: "1.85rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    textAlign: "center" as const,
  },
  subtitle: {
    margin: "0 0 2.25rem 0",
    color: "#64748b",
    fontSize: "1.05rem",
    textAlign: "center" as const,
    maxWidth: "320px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.75rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#334155",
    marginLeft: "4px",
  },
  input: {
    padding: "1.1rem 1.25rem",
    borderRadius: "14px",
    border: "2px solid #e2e8f0",
    fontSize: "1.1rem",
    fontFamily: "var(--body)",
    color: "#0f172a",
    outline: "none",
    backgroundColor: "#f8fafc",
    width: "100%",
    boxSizing: "border-box" as const,
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "1.1rem",
    borderRadius: "14px",
    border: "none",
    fontSize: "1.1rem",
    fontFamily: "var(--body)",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box" as const,
    marginTop: "0.5rem",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 10px 15px -3px rgb(79 70 229 / 0.3)",
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    padding: "1rem 1.25rem",
    borderRadius: "12px",
    fontSize: "1rem",
    marginBottom: "1.5rem",
    border: "1px solid #fee2e2",
  },
  footerText: {
    marginTop: "2.25rem",
    textAlign: "center" as const,
    color: "#64748b",
    fontSize: "1rem",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#4f46e5",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
    fontSize: "1rem",
    fontFamily: "var(--body)",
  },
};