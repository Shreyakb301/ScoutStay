"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Link2,
  RotateCcw,
  Rows3,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEMO_STEPS = [
  {
    label: "Add links",
    detail: "Paste two Airbnb listings",
    icon: Link2,
  },
  {
    label: "Review",
    detail: "Verify imported amenities",
    icon: ClipboardCheck,
  },
  {
    label: "Compare",
    detail: "See shared and unique features",
    icon: Rows3,
  },
] as const;

const LISTINGS = [
  {
    number: "01",
    name: "East Side Loft",
    area: "East Nashville",
    url: "airbnb.com/rooms/loft-demo",
    amenities: [
      "Wi-Fi",
      "Kitchen",
      "Air conditioning",
      "Washer",
      "Dedicated workspace",
      "Self check-in",
      "Free parking",
    ],
  },
  {
    number: "02",
    name: "Garden Bungalow",
    area: "12 South",
    url: "airbnb.com/rooms/bungalow-demo",
    amenities: [
      "Wi-Fi",
      "Kitchen",
      "Air conditioning",
      "Washer",
      "Dedicated workspace",
      "Self check-in",
      "Hot tub",
      "Patio",
    ],
  },
] as const;

const SHARED = [
  "Wi-Fi",
  "Kitchen",
  "Air conditioning",
  "Washer",
  "Dedicated workspace",
  "Self check-in",
];

function DemoLinks({ onNext }: { onNext: () => void }) {
  return (
    <div className="grid min-h-[22rem] content-center gap-5 p-5 sm:p-8">
      <div>
        <p className="eyebrow text-signal">Sample trip · Nashville weekend</p>
        <h3 className="mt-2 text-2xl font-bold uppercase tracking-tight">
          Start with your shortlist
        </h3>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Add the public listing links you already have open. ScoutStay keeps
          the source attached so every imported detail can be checked.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {LISTINGS.map((listing) => (
          <div key={listing.number} className="border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow">Listing {listing.number}</span>
              <span className="data text-[0.65rem] text-go">Ready</span>
            </div>
            <div className="mt-3 flex items-center gap-2 border border-input bg-card px-3 py-2.5">
              <Link2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="data truncate text-xs">{listing.url}</span>
              <Check className="ml-auto size-4 shrink-0 text-go" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          This walkthrough uses sample data—no account or API key needed.
        </span>
        <Button type="button" size="lg" onClick={onNext}>
          Import sample listings <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

function DemoReview({ onNext }: { onNext: () => void }) {
  return (
    <div className="grid min-h-[22rem] gap-5 p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-signal">Import complete</p>
          <h3 className="mt-2 text-2xl font-bold uppercase tracking-tight">
            Check what was found
          </h3>
        </div>
        <span className="data border border-go/40 px-2 py-1 text-[0.65rem] uppercase text-go">
          2 of 2 reviewed
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {LISTINGS.map((listing) => (
          <div key={listing.number} className="border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <span className="eyebrow">Listing {listing.number}</span>
                <p className="mt-1 font-semibold">{listing.name}</p>
                <p className="text-xs text-muted-foreground">{listing.area}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-go">
                <Check className="size-3.5" /> Reviewed
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {listing.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1.5 border border-border bg-card px-2 py-1 text-xs"
                >
                  <span className="size-1.5 bg-go" aria-hidden />
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          In a real comparison, you can correct names and amenities here.
        </span>
        <Button type="button" size="lg" onClick={onNext}>
          Compare these stays <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

function IncludedMark({ included }: { included: boolean }) {
  return (
    <span
      className={cn(
        "mx-auto block size-3 border",
        included ? "border-go bg-go" : "border-border bg-transparent"
      )}
      aria-label={included ? "Included" : "Not included"}
    />
  );
}

function DemoComparison({ onReset }: { onReset: () => void }) {
  const differences = [
    { label: "Free parking", first: true, second: false },
    { label: "Hot tub", first: false, second: true },
    { label: "Patio", first: false, second: true },
  ];

  return (
    <div className="grid min-h-[22rem] gap-5 p-5 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="eyebrow text-signal">Comparison ready</p>
          <h3 className="mt-2 text-2xl font-bold uppercase tracking-tight">
            Differences you can use
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Both cover the essentials. The decision comes down to parking
            versus two outdoor extras—not an unexplained score.
          </p>
        </div>
        <div className="border-l-2 border-go pl-3">
          <span className="eyebrow">Shared</span>
          <p className="data text-2xl font-bold">{SHARED.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-border bg-background p-4">
          <p className="eyebrow">Included in both</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SHARED.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 border border-go/40 px-2 py-1 text-xs"
              >
                <Check className="size-3 text-go" /> {amenity}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden border border-border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="eyebrow px-3 py-2 text-left">Only one stay has</th>
                <th className="px-3 py-2 text-center">
                  <span className="data block text-xs">01</span>
                  <span className="block max-w-24 truncate text-[0.65rem] font-normal text-muted-foreground">
                    East Side
                  </span>
                </th>
                <th className="px-3 py-2 text-center">
                  <span className="data block text-xs">02</span>
                  <span className="block max-w-24 truncate text-[0.65rem] font-normal text-muted-foreground">
                    Bungalow
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {differences.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5">{row.label}</td>
                  <td className="px-3 py-2.5 text-center">
                    <IncludedMark included={row.first} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <IncludedMark included={row.second} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onReset}>
          <RotateCcw /> Replay demo
        </Button>
        <Button nativeButton={false} size="lg" render={<Link href="/compare" />}>
          Compare my Airbnbs <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

export function HomeDemo() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="demo" className="scroll-mt-20 py-14" aria-labelledby="demo-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-foreground pb-3">
        <div>
          <span className="eyebrow text-signal">Interactive walkthrough</span>
          <h2 id="demo-heading" className="mt-2 text-3xl font-bold uppercase tracking-tight md:text-4xl">
            Try the comparison
          </h2>
        </div>
        <span className="data text-xs text-muted-foreground">Sample · 60 sec</span>
      </div>

      <div className="mt-6 overflow-hidden border-2 border-foreground bg-card">
        <div className="grid border-b border-foreground bg-muted/30 md:grid-cols-3" role="tablist" aria-label="Demo steps">
          {DEMO_STEPS.map((step, index) => {
            const Icon = step.icon;
            const active = activeStep === index;
            const complete = activeStep > index;
            return (
              <button
                key={step.label}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="home-demo-panel"
                onClick={() => setActiveStep(index)}
                className={cn(
                  "flex items-center gap-3 border-b border-border p-4 text-left transition-colors last:border-b-0 hover:bg-muted md:border-r md:border-b-0 md:last:border-r-0",
                  active && "bg-card",
                  complete && "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "data flex size-8 shrink-0 items-center justify-center border text-xs font-bold",
                    active && "border-signal bg-signal text-signal-foreground",
                    complete && "border-go bg-go text-white",
                    !active && !complete && "border-border bg-background"
                  )}
                >
                  {complete ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{step.label}</span>
                  <span className="block text-xs text-muted-foreground">{step.detail}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div id="home-demo-panel" role="tabpanel" aria-live="polite">
          {activeStep === 0 && <DemoLinks onNext={() => setActiveStep(1)} />}
          {activeStep === 1 && <DemoReview onNext={() => setActiveStep(2)} />}
          {activeStep === 2 && <DemoComparison onReset={() => setActiveStep(0)} />}
        </div>
      </div>
    </section>
  );
}
