import type { Metadata } from "next";

import { DecisionWorkspace } from "@/components/decision-workspace";

export const metadata: Metadata = {
  title: "Decision briefing",
  description:
    "Compare two to five stays using your trip needs, location signals, cost, and listing evidence.",
};

export default function BriefPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 border-b-4 border-foreground pb-5">
        <p className="eyebrow text-signal">Personalized stay ranking</p>
        <h1 className="mt-2 text-4xl font-bold uppercase tracking-tight sm:text-5xl">
          New decision briefing
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Define the trip, add two to five stays, and get an explainable
          recommendation grounded in listing and location data.
        </p>
      </div>
      <DecisionWorkspace />
    </div>
  );
}
