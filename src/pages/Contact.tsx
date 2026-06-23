import SiteShell from "@/components/SiteShell";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface ContactFormState {
  name: string;
  email: string;
  company: string;
  message: string;
}

const Contact = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<ContactFormState>({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const source = searchParams.get("source");
  const ad = searchParams.get("ad");

  const onChange = (field: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitted(false);

    const normalized = {
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      message: form.message.trim(),
    };

    if (!normalized.name || !normalized.email || !normalized.company || !normalized.message) {
      setError("Please complete all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Demo form submit placeholder until backend endpoint is connected.
      await new Promise((resolve) => setTimeout(resolve, 700));
      setSubmitted(true);
      setForm({ name: "", email: "", company: "", message: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SiteShell>
      <section className="relative overflow-hidden pb-12 pt-28 md:pt-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 grid-pattern opacity-25" />
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contact Us</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-5xl">Let&apos;s launch your campaign.</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Tell us your goals and we&apos;ll help you set up contextual ad placements for your assistant or brand.
            </p>
            {(source || ad) && (
              <div className="mt-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Lead source: {source ?? "site"}{ad ? ` / ${ad}` : ""}
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background p-4">
                <Mail className="h-5 w-5 text-primary" />
                <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="mt-1 text-sm font-semibold text-foreground">info@prismpublication.com</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <Phone className="h-5 w-5 text-primary" />
                <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="mt-1 text-sm font-semibold text-foreground">+1 (555) 010-2290</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Reply Time</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Within 1 business day</p>
              </div>
            </div>

            <form className="mt-6 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit} noValidate>
              <input
                type="text"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="Your name"
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
                autoComplete="name"
                required
              />
              <input
                type="email"
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
                placeholder="Work email"
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
                autoComplete="email"
                required
              />
              <input
                type="text"
                value={form.company}
                onChange={(event) => onChange("company", event.target.value)}
                placeholder="Company"
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
                autoComplete="organization"
                required
              />
              <textarea
                value={form.message}
                onChange={(event) => onChange("message", event.target.value)}
                placeholder="What are you trying to launch?"
                rows={5}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground md:col-span-2"
                required
              />
              {error && <p className="text-sm font-medium text-destructive md:col-span-2">{error}</p>}
              {submitted && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2">
                  Thanks, your inquiry was sent. Our team will contact you within 1 business day.
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2 md:w-fit"
              >
                {isSubmitting ? "Sending..." : "Send Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </SiteShell>
  );
};

export default Contact;
