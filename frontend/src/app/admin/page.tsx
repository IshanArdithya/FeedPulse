import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-white px-5 py-5 md:px-8 md:py-8">
      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel flex flex-col justify-between gap-8 p-6 md:p-8">
          <div className="flex flex-wrap gap-3">
            <span className="mono-kicker">Restricted access</span>
            <span className="mono-kicker">Admin only</span>
          </div>

          <div className="space-y-5">
            <p className="eyebrow">FeedPulse admin</p>
            <h1 className="section-heading max-w-3xl">
              Review product signals without losing the context behind them.
            </h1>
            <p className="subheading max-w-2xl">
              The dashboard gives your product team one place to scan trends,
              review urgent feedback, update statuses, and re-run AI analysis when
              new context matters.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <AdminFeature title="Triaging" body="Review new submissions and turn noise into a cleaner queue." />
            <AdminFeature title="Prioritizing" body="Use AI score, sentiment, and tags to spot what deserves follow-up." />
            <AdminFeature title="Tracking" body="Move items from new to resolved without leaving the dashboard." />
          </div>

          <Link className="button-secondary w-fit" href="/">
            Back to public form
          </Link>
        </section>

        <section className="flex flex-col gap-4">
          <div className="panel-dark">
            <p className="eyebrow !text-white/60">Sign in</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Access the admin dashboard
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Use the configured admin account to access filters, summaries, status
              updates, and AI re-analysis tools.
            </p>
          </div>
          <AdminLoginForm />
        </section>
      </div>
    </main>
  );
}

function AdminFeature({ title, body }: { title: string; body: string }) {
  return (
    <article className="metric-card">
      <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{body}</p>
    </article>
  );
}
