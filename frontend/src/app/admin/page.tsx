import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f5f2e9_0%,_#edf3f7_100%)] px-6 py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="panel flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="eyebrow">FeedPulse admin</p>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)]">
              Review product feedback with AI context attached.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[var(--muted-strong)]">
              Log in with the configured admin account to filter submissions,
              update statuses, review sentiment, and inspect the top themes from
              the past week.
            </p>
          </div>

          <Link className="button-secondary w-fit" href="/">
            Back to public form
          </Link>
        </section>

        <section className="space-y-4">
          <div>
            <p className="eyebrow">Restricted access</p>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">Sign in</h2>
          </div>
          <AdminLoginForm />
        </section>
      </div>
    </main>
  );
}

