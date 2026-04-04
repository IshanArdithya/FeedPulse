import Link from "next/link";
import { FeedbackForm } from "@/components/feedback-form";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-5 py-5 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <header className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white">
              FP
            </div>
            <div>
              <p className="eyebrow">FeedPulse</p>
              <p className="text-sm text-(--muted-strong)">
                AI-powered product feedback platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" asChild>
              <Link href="/admin">
                Admin login
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-6 py-12 md:py-20">
          <div className="inline-flex rounded-full bg-black/5 px-4 py-1.5 text-sm font-medium text-black">
            Share Your Voice
          </div>
          <h1 className="section-heading max-w-4xl">
            Help us build a better product, together.
          </h1>
          <p className="subheading max-w-2xl mx-auto text-lg pt-2 md:pt-4">
            Your feedback directly influences our roadmap. Tell us what's working, what's broken, and what you'd love to see next. We're all ears.
          </p>
        </section>

        {/* Two Column Section */}
        <section className="grid gap-8 lg:grid-cols-[1fr_1fr] items-start pb-16">
          {/* Left Side: Benefits */}
          <section className="panel flex flex-col gap-8 p-6 md:p-10 sticky top-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight text-(--ink)">
                Why your feedback matters
              </h2>
              <p className="text-base leading-7 text-(--muted-strong)">
                We believe the best products are built in collaboration with the people who use them every day. Here is what happens when you share your thoughts:
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <BenefitItem
                title="Direct Impact"
                body="Every piece of feedback is read and categorized. Your voice actively shapes our upcoming features."
              />
              <BenefitItem
                title="Faster Fixes"
                body="Reporting bugs directly helps our engineering team identify and resolve issues much faster."
              />
              <BenefitItem
                title="Continuous Improvement"
                body="Even small suggestions help us polish the user experience and make the product better for everyone."
              />
            </div>
          </section>

          {/* Right Side: Form */}
          <section className="flex flex-col">
            <FeedbackForm />
          </section>
        </section>
      </div>
    </main>
  );
}

function BenefitItem({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <article className="panel-soft flex flex-col gap-3 p-6 transition-transform hover:scale-[1.01] duration-300">
      <h3 className="text-lg font-semibold text-(--ink)">{title}</h3>
      <p className="text-sm leading-6 text-(--muted-strong)">{body}</p>
    </article>
  );
}
