export function SiteFooter() {
  return (
    <footer className="border-t border-foreground">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <p className="eyebrow">
          © {new Date().getFullYear()} ScoutStay
        </p>
        <p className="eyebrow">Listings imported with Firecrawl</p>
      </div>
    </footer>
  );
}
