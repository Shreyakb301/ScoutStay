import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  GitCompareArrows,
  ListPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const SHARED_AMENITIES = ["Wi-Fi", "Kitchen", "A/C", "Washer"];

function StayCard({ number, name }: { number: string; name: string }) {
  return (
    <div className="flex items-center gap-3 border border-border bg-card px-3 py-2.5">
      <span className="data flex size-7 shrink-0 items-center justify-center bg-foreground text-xs font-bold text-background">
        {number}
      </span>
      <span className="min-w-0">
        <span className="eyebrow block">Shortlisted stay</span>
        <span className="block truncate text-sm font-semibold">{name}</span>
      </span>
      <Check className="ml-auto size-4 shrink-0 text-go" />
    </div>
  );
}

function Marker({ included }: { included: boolean }) {
  return (
    <span
      className={`mx-auto block size-3 border ${
        included ? "border-go bg-go" : "border-border"
      }`}
      aria-label={included ? "Included" : "Not included"}
    />
  );
}

export function HomeDemo() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 py-14"
      aria-labelledby="workflow-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-foreground pb-3">
        <div>
          <span className="eyebrow text-signal">Example workflow</span>
          <h2
            id="workflow-heading"
            className="mt-2 text-3xl font-bold uppercase tracking-tight md:text-4xl"
          >
            How ScoutStay works
          </h2>
        </div>
        <span className="data text-xs text-muted-foreground">
          Shortlist → clarity
        </span>
      </div>

      <p className="mt-4 max-w-2xl text-muted-foreground">
        Bring the stays you are considering. ScoutStay organizes what each one
        offers and turns a messy shortlist into a clear side-by-side decision.
      </p>

      <div className="mt-6 grid gap-px border border-border bg-border lg:grid-cols-3">
        <article className="flex flex-col bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="data text-3xl font-bold text-signal">01</span>
              <h3 className="mt-2 text-lg font-bold uppercase tracking-tight">
                Add your shortlist
              </h3>
            </div>
            <ListPlus className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Start with the two stays you are already considering.
          </p>
          <div className="mt-5 grid gap-2">
            <StayCard number="01" name="East Side Loft" />
            <StayCard number="02" name="Garden Bungalow" />
          </div>
        </article>

        <article className="flex flex-col bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="data text-3xl font-bold text-signal">02</span>
              <h3 className="mt-2 text-lg font-bold uppercase tracking-tight">
                Review the details
              </h3>
            </div>
            <ClipboardCheck className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Amenities are organized so you can quickly verify what matters.
          </p>
          <div className="mt-5 border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
              <span className="eyebrow">Found in both</span>
              <span className="data text-xs text-go">Reviewed</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SHARED_AMENITIES.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1.5 border border-go/40 px-2 py-1 text-xs"
                >
                  <Check className="size-3 text-go" /> {amenity}
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="flex flex-col bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="data text-3xl font-bold text-signal">03</span>
              <h3 className="mt-2 text-lg font-bold uppercase tracking-tight">
                See the difference
              </h3>
            </div>
            <GitCompareArrows className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Shared essentials and unique extras appear side by side.
          </p>
          <div className="mt-5 overflow-hidden border border-border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="eyebrow px-3 py-2 text-left">Amenity</th>
                  <th className="data px-3 py-2 text-center text-xs">01</th>
                  <th className="data px-3 py-2 text-center text-xs">02</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-3 py-2.5">Free parking</td>
                  <td><Marker included /></td>
                  <td><Marker included={false} /></td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5">Hot tub</td>
                  <td><Marker included={false} /></td>
                  <td><Marker included /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-x border-b border-border bg-card p-5 sm:p-6">
        <p className="max-w-xl text-sm text-muted-foreground">
          No hidden score—just the evidence you need to choose confidently.
        </p>
        <Button nativeButton={false} size="lg" render={<Link href="/compare" />}>
          Compare my stays <ArrowRight />
        </Button>
      </div>
    </section>
  );
}
