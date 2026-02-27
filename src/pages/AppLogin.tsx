import { FormEvent, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SiteShell from "@/components/SiteShell";
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
    <SiteShell>
      <section className="relative flex min-h-[calc(100vh-240px)] items-center overflow-hidden bg-background px-4 py-16 pt-28 md:py-20 md:pt-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 grid-pattern opacity-65" />
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
        </div>
        <div className="relative mx-auto w-full max-w-5xl">
          <Card className="border-border/80 bg-card/90 shadow-xl backdrop-blur-xl">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-[1.05fr_0.95fr]">
                <section className="border-b border-border/70 p-6 md:border-b-0 md:border-r md:p-8">
                  <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">BotGrid App</p>
                  <h1 className="mt-2 text-4xl font-bold tracking-tight">One Login. Two Workspaces.</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sign in once, then choose Advertiser or Bot Developer workspace.
                  </p>
                  <div className="mt-5 space-y-3">
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
                  </div>
                </section>

                <section className="p-6 md:p-8">
                  <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Authentication</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight">
                    {mode === "signin" ? "Sign In" : "Create Account"}
                  </h2>
                  <div className="mb-4 mt-4 grid grid-cols-2 rounded-full border border-border/80 bg-background p-1 text-sm">
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
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      disabled={disabled || submitting || loading}
                    >
                      {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
                    </Button>
                  </form>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </SiteShell>
  );
};

export default AppLogin;
