import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";

type Mode = "signin" | "signup" | "forgot";

const AppLogin = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = usePortalAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const disabled = useMemo(() => {
    if (mode === "forgot") return !email.trim();
    if (!email.trim() || !password.trim()) return true;
    if (mode === "signup" && !name.trim()) return true;
    return false;
  }, [email, password, name, mode]);

  if (!loading && user) {
    return <Navigate to="/app/choose-workspace" replace />;
  }

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      if (mode === "forgot") {
        await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/app/login`,
        });
        setNotice("Password reset email sent. Check your inbox.");
        return;
      }
      if (mode === "signin") {
        await signIn(email.trim().toLowerCase(), password);
      } else {
        await signUp(name.trim(), email.trim().toLowerCase(), password);
      }
      navigate("/app/choose-workspace", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[130px]" />
      </div>

      <Link to="/" className="relative mb-8 flex items-center gap-2.5">
        <img src="/prismlogo.png" alt="Prism" className="h-8 w-8 object-contain" />
        <span className="text-xl font-bold tracking-tight">Prism</span>
      </Link>

      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card/90 p-8 shadow-xl backdrop-blur-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signin" && "Sign in to Prism"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" && "Welcome back. Enter your credentials to continue."}
            {mode === "signup" && "Get started with Prism in seconds."}
            {mode === "forgot" && "We'll send a reset link to your email address."}
          </p>
        </div>

        {mode !== "forgot" && (
          <div className="mb-5 grid grid-cols-2 rounded-full border border-border/80 bg-background p-1 text-sm">
            <button
              type="button"
              className={`rounded-full px-3 py-2 transition-colors ${
                mode === "signin"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => switchMode("signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-2 transition-colors ${
                mode === "signup"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => switchMode("signup")}
            >
              Sign Up
            </button>
          </div>
        )}

        <form className="space-y-4" onSubmit={submit}>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Jane Doe"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="you@company.com"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => switchMode("forgot")}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground">
                  Use at least 8 characters with letters, numbers, and one symbol.
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
          {notice && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={disabled || submitting || loading}
          >
            {submitting
              ? "Please wait..."
              : mode === "signin"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Reset Email"}
          </Button>
        </form>

        {mode === "forgot" && (
          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-primary hover:underline"
            onClick={() => switchMode("signin")}
          >
            Back to sign in
          </button>
        )}
      </div>

      <p className="relative mt-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">
          ← Back to website
        </Link>
      </p>
    </div>
  );
};

export default AppLogin;
