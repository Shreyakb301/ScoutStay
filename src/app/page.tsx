import Link from "next/link";

import { HomeDemo } from "@/components/home-demo";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    code: "01",
    title: "Paste two links",
    description:
      "Add the two public Airbnb room links you want to compare.",
  },
  {
    code: "02",
    title: "Review the amenities",
    description:
      "Firecrawl imports both listings. Correct or add anything Airbnb did not expose.",
  },
  {
    code: "03",
    title: "Compare the differences",
    description:
      "See common amenities first, then a neutral table of what only one listing provides.",
  },
];

const CAPABILITIES = [
  ["Firecrawl import", "Two listings are imported concurrently on the server"],
  ["Editable review", "Add or remove amenities before accepting scraped data"],
  ["Shared amenities", "See what both properties provide at a glance"],
  ["Neutral differences", "Compare unique amenities without a forced winner"],
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="border-b-4 border-foreground py-16 md:py-24">
        <span className="eyebrow text-foreground">
          Airbnb amenity comparison
        </span>
        <h1 className="mt-5 max-w-4xl text-5xl font-bold uppercase leading-[0.95] tracking-tight md:text-7xl">
          See what each stay actually provides
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Paste two Airbnb links and ScoutStay will organize their amenities
          into a clear, reviewable comparison. See what both stays share and
          what makes each one different without a black-box score.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button nativeButton={false} size="lg" render={<Link href="/brief" />}>
            Build a decision brief
          </Button>
          <Button nativeButton={false} size="lg" render={<Link href="/compare" />}>
            Compare two Airbnbs
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="#demo" />}
          >
            Try the demo
          </Button>
        </div>
      </section>

      {/* Procedure */}
      <section id="procedure" className="scroll-mt-20 py-14">
        <div className="flex items-baseline gap-3 border-b-2 border-foreground pb-2">
          <span className="data text-xs font-semibold text-signal">§</span>
          <h2 className="text-lg font-bold uppercase tracking-[0.12em]">
            How it works
          </h2>
        </div>
        <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.code} className="flex flex-col gap-3 bg-card p-6">
              <span className="data text-3xl font-bold text-signal">
                {step.code}
              </span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <HomeDemo />

      {/* Capabilities */}
      <section className="py-14">
        <div className="flex items-baseline gap-3 border-b-2 border-foreground pb-2">
          <span className="data text-xs font-semibold text-signal">§</span>
          <h2 className="text-lg font-bold uppercase tracking-[0.12em]">
            Comparison included
          </h2>
        </div>
        <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {CAPABILITIES.map(([title, body]) => (
            <div key={title} className="border-l-2 border-border pl-4">
              <dt className="eyebrow text-foreground">{title}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="my-8 flex flex-col items-start gap-4 border-2 border-foreground p-8 md:p-12">
        <h2 className="max-w-2xl text-3xl font-bold uppercase tracking-tight md:text-4xl">
          Ready to settle the debate?
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Paste your two shortlisted Airbnb links, verify the imported details,
          and compare their amenities side by side.
        </p>
        <Button nativeButton={false} size="lg" render={<Link href="/compare" />}>
          Compare amenities
        </Button>
      </section>
    </div>
  );
}
