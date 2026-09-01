import type { Metadata } from "next";

import { CompareForm } from "@/components/compare-form";

export const metadata: Metadata = {
  title: "Compare Airbnb amenities",
  description: "Compare the shared and unique amenities from two Airbnb listings.",
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 border-b-4 border-foreground pb-5">
        <h1 className="text-4xl font-bold uppercase tracking-tight sm:text-5xl">
          Compare Airbnb amenities
        </h1>
      </div>
      <CompareForm />
    </div>
  );
}
