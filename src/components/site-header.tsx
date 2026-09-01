"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-foreground bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="data flex h-7 items-center border-2 border-foreground px-1.5 text-sm font-bold tracking-wider">
            SCT
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold uppercase tracking-[0.14em]">
              ScoutStay
            </span>
            <span className="eyebrow text-[0.6rem]">Amenity comparison</span>
          </span>
        </Link>

        <nav aria-label="Primary navigation">
          <Button
            nativeButton={false}
            size="sm"
            render={<Link href="/compare" />}
          >
            Compare Airbnbs
          </Button>
        </nav>
      </div>
    </header>
  );
}
