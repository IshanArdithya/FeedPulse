import Link from "next/link";
import { FeedbackForm } from "@/components/feedback-form";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(246,196,78,0.35),_transparent_36%),linear-gradient(135deg,_#f7f0d4_0%,_#f4efe8_45%,_#e7eef8_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">FeedPulse</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--ink)] md:text-6xl">
              Capture raw user feedback. Turn it into product clarity.
            </h1>
          </div>
          <Link className="button-secondary" href="/admin">
            Admin login
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="panel flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <p className="eyebrow">Public feedback portal</p>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-strong)]">
                FeedPulse helps product teams collect bugs, feature requests, and
                improvements in one place, then uses Gemini to categorize, score,
                and summarize what matters most.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FeatureCard
                title="Structured intake"
                body="Simple enough for anyone to submit, specific enough for a PM to act on."
              />
              <FeatureCard
                title="AI triage"
                body="Gemini tags sentiment, priority, and core themes on every submission."
              />
              <FeatureCard
                title="Team visibility"
                body="An admin dashboard surfaces what is new, urgent, and trending."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="eyebrow">Submit feedback</p>
              <h2 className="text-2xl font-semibold text-[var(--ink)]">
                Share what should be built or fixed next
              </h2>
            </div>
            <FeedbackForm />
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-[28px] border border-white/60 bg-white/55 p-5 shadow-[0_18px_45px_rgba(75,75,75,0.08)] backdrop-blur">
      <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{body}</p>
    </article>
  );
}
