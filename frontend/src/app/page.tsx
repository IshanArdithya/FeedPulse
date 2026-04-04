import Link from "next/link";
import { FeedbackForm } from "@/components/feedback-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-5 py-5 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white">
              FP
            </div>
            <div>
              <p className="eyebrow">FeedPulse</p>
              <p className="text-sm text-[var(--muted-strong)]">
                AI-powered product feedback platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono-kicker hidden md:inline-flex">
              Internal product intelligence
            </span>
            <Link className="button-primary" href="/admin">
              Admin login
            </Link>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="panel flex flex-col gap-10 p-6 md:p-8">
            <div className="flex flex-wrap gap-3">
              <span className="mono-kicker">Public intake</span>
              <span className="mono-kicker">No account required</span>
            </div>

            <div className="space-y-6">
              <h1 className="section-heading max-w-4xl">
                Collect customer pain points with a form that feels worth filling out.
              </h1>
              <p className="subheading max-w-2xl">
                FeedPulse turns raw requests, bugs, and workflow complaints into a
                clean review queue for product teams. Submit feedback once, then let
                Gemini categorize, summarize, and score what deserves attention next.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FeatureCard
                index="01"
                title="Structured signals"
                body="Every submission captures enough context for a PM or engineer to act without follow-up guesswork."
              />
              <FeatureCard
                index="02"
                title="Fast AI triage"
                body="Gemini adds sentiment, summary, tags, and urgency so patterns emerge immediately."
              />
              <FeatureCard
                index="03"
                title="Review-ready queue"
                body="The admin dashboard groups incoming feedback into something a product team can actually prioritize."
              />
            </div>

            <div className="surface-rule pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Metric label="Submission flow" value="Under 1 min" />
                <Metric label="AI outputs" value="Sentiment, tags, score" />
                <Metric label="Admin controls" value="Filter, review, update" />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="panel-dark">
              <p className="eyebrow !text-white/60">Submit feedback</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Tell the team what needs to be built, fixed, or improved.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
                Use this form for bugs, product ideas, workflow frustrations, or
                smaller improvements. The best submissions are specific, concrete,
                and tied to real usage.
              </p>
            </div>
            <FeedbackForm />
          </section>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="panel-soft flex flex-col gap-6">
            <div>
              <p className="eyebrow">What teams get</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)]">
                A calmer intake experience on the front, a sharper decision surface on the back.
              </h3>
            </div>
            <div className="grid gap-4">
              <DetailRow
                title="Minimal friction for submitters"
                body="Anonymous access, clear fields, and instant confirmation keep the public experience lightweight."
              />
              <DetailRow
                title="Better product conversations"
                body="Summaries, tags, sentiment, and priority help teams talk about themes instead of digging through paragraphs."
              />
              <DetailRow
                title="Designed for internal review"
                body="Search, sorting, status updates, and weekly summaries keep the dashboard useful after the novelty wears off."
              />
            </div>
          </section>

          <section className="panel flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Workflow</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)]">
                  From submission to roadmap signal
                </h3>
              </div>
              <span className="mono-kicker">Human review still in control</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <ProcessCard
                step="1"
                title="Collect"
                body="Users submit feedback with a title, category, and enough detail to explain the problem."
              />
              <ProcessCard
                step="2"
                title="Analyze"
                body="Gemini classifies the request, scores urgency, and extracts short tags and a usable summary."
              />
              <ProcessCard
                step="3"
                title="Decide"
                body="Admins filter, search, and update statuses while tracking the strongest recent themes."
              />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <article className="metric-card flex flex-col gap-8">
      <span className="text-xs font-semibold tracking-[0.18em] text-[var(--muted)]">
        {index}
      </span>
      <div>
        <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{body}</p>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

function DetailRow({ title, body }: { title: string; body: string }) {
  return (
    <article className="metric-card">
      <h4 className="text-lg font-semibold text-[var(--ink)]">{title}</h4>
      <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{body}</p>
    </article>
  );
}

function ProcessCard({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <article className="panel-soft flex flex-col gap-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] text-sm font-semibold text-[var(--ink)]">
        {step}
      </div>
      <div>
        <h4 className="text-lg font-semibold text-[var(--ink)]">{title}</h4>
        <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{body}</p>
      </div>
    </article>
  );
}
