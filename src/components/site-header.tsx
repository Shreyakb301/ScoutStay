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
            <span className="eyebrow text-[0.6rem]">Stay decision support</span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-2">
          <Button
            nativeButton={false}
            size="sm"
            variant="ghost"
            render={<Link href="/brief" />}
          >
            <span className="sm:hidden">Brief</span>
            <span className="hidden sm:inline">Decision brief</span>
          </Button>
          <Button
            nativeButton={false}
            size="sm"
            render={<Link href="/compare" />}
          >
            <span className="sm:hidden">Compare</span>
            <span className="hidden sm:inline">Compare Airbnbs</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
