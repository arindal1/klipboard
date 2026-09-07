"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BackgroundCanvas } from "@/components/three/BackgroundCanvas";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { softSpring } from "@/lib/motion";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="auth">
      <BackgroundCanvas intensity={0.6} />
      <div className="auth__scrim" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
        className="auth__wrap"
      >
        <Panel className="auth__panel">
          <form onSubmit={handleSubmit} className="auth__form">
            <Link href="/" className="auth__brand">
              KlipBoard
            </Link>
            <h1>Create your Klip account</h1>

            <label>
              Username
              <Panel inset className="auth__field">
                <input
                  required
                  minLength={3}
                  maxLength={24}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Panel>
            </label>

            <label>
              Email
              <Panel inset className="auth__field">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Panel>
            </label>

            <label>
              Password
              <Panel inset className="auth__field">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Panel>
            </label>

            {error && <p className="auth__error">{error}</p>}

            <Button type="submit" variant="primary" disabled={loading} className="auth__submit">
              {loading ? "Creating account…" : "Create account"}
            </Button>

            <div className="auth__oauth">
              <Button type="button" onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>
                Continue with GitHub
              </Button>
              <Button type="button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
                Continue with Google
              </Button>
            </div>

            <p className="auth__switch">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </form>
        </Panel>
      </motion.div>

      <style>{`
        .auth { position: relative; min-height: 100dvh; display: grid; place-items: center; font-family: system-ui, sans-serif; padding: 16px; overflow-x: hidden; }
        .auth__scrim { position: fixed; inset: 0; z-index: 1; pointer-events: none; background: radial-gradient(circle at 50% 40%, rgba(23,24,28,0.35), rgba(23,24,28,0.85)); }
        .auth__wrap { position: relative; z-index: 2; width: 100%; max-width: 420px; }
        .auth__panel { padding: 24px 20px; }
        .auth__form { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .auth__brand { font-weight: 700; font-size: 18px; letter-spacing: -0.02em; color: #7ef2c9; margin-bottom: 4px; }
        h1 { font-size: 1.4rem; margin: 0 0 8px; color: #ececf0; }
        label { display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem; color: #b7b7c2; }
        .auth__field { padding: 2px; }
        .auth__field input { width: 100%; min-width: 0; padding: 12px 14px; border: none; background: transparent; color: #ececf0; font-size: 16px; outline: none; }
        .auth__submit { width: 100%; padding: 14px; min-height: 44px; }
        .auth__oauth { display: flex; flex-direction: column; gap: 10px; }
        .auth__oauth button { width: 100%; min-height: 44px; }
        .auth__error { color: #ff8080; font-size: 0.85rem; margin: 0; }
        .auth__switch { font-size: 0.85rem; color: #8a8a92; margin-top: 4px; }
        .auth__switch a { color: #7ef2c9; }

        @media (min-width: 481px) {
          .auth { padding: 24px; }
          .auth__panel { padding: 40px; }
        }
      `}</style>
    </main>
  );
}