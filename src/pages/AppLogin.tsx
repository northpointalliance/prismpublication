import { FormEvent, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";

const AppLogin = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = usePortalAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const disabled = useMemo(() => {
    if (!email.trim() || !password.trim()) return true;
    if (mode === "signup" && !name.trim()) return true;
    return false;
  }, [email, password, name, mode]);

  if (!loading && user) {
    return <Navigate to="/app/choose-workspace" replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    setSubmitting(true);
    setError("");
    try {
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
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-60" />
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
      </div>
      <div className="relative mx-auto max-w-md">
        <Card className="border-border/80 bg-card/90 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Unified Login</p>
            <CardTitle className="text-3xl font-bold tracking-tight">Access Portal</CardTitle>
            <p className="text-sm text-muted-foreground">
              One login for advertisers, bot developers, and platform admins.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              {mode === "signup" && (
                <Input
                  placeholder="Full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              )}
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
              )}
              <Button type="submit" variant="hero" className="w-full" disabled={disabled || submitting || loading}>
                {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {mode === "signin" ? "New here?" : "Already have an account?"}
              </span>
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setMode((current) => (current === "signin" ? "signup" : "signin"))}
              >
                {mode === "signin" ? "Create account" : "Sign in"}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Dev test users are available in docs for advertiser and bot developer portal testing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppLogin;
