import { FormEvent, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
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
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-65" />
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
      </div>
      <div className="relative mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/80 bg-card/85 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">BotGrid App</p>
            <CardTitle className="text-4xl font-bold tracking-tight">One Login. Two Workspaces.</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in once, then choose Advertiser or Bot Developer workspace.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Create account or sign in",
              "Pick your first workspace after login",
              "Start from pre-filled dashboard examples",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-xl border border-border/70 bg-background/70 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/90 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Authentication</p>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 rounded-full border border-border/80 bg-background p-1 text-sm">
              <button
                type="button"
                className={`rounded-full px-3 py-2 transition-colors ${
                  mode === "signin"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setMode("signin")}
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
                onClick={() => setMode("signup")}
              >
                Sign Up
              </button>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              {mode === "signup" && (
                <Input
                  placeholder="Full name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              )}
              <Input
                placeholder="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                placeholder="Password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground">
                  Use at least 8 characters with letters, numbers, and one symbol.
                </p>
              )}
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
              )}
              <Button type="submit" variant="hero" className="w-full" disabled={disabled || submitting || loading}>
                {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppLogin;
