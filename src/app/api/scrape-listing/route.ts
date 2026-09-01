import { normalizeScrapedItem, isValidAirbnbUrl } from "@/lib/listing-normalizer";
import { scrapeAirbnbListing, ScrapeError } from "@/lib/scrape-listing";
import type { ScrapeErrorCode, ScrapeResult } from "@/lib/scrape-types";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function fail(code: ScrapeErrorCode, error: string, status: number): Response {
  return Response.json({ ok: false, code, error } satisfies ScrapeResult, {
    status,
  });
}

function isoDateString(value: unknown): string | undefined {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : undefined;
}

export async function POST(request: Request): Promise<Response> {
  const rate = checkRateLimit(request, "scrape-listing", {
    limit: 10,
    windowMs: 10 * 60_000,
  });
  if (!rate.allowed) return rateLimitResponse(rate);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("invalid_url", "Request body must be JSON with a `url`.", 400);
  }

  const url = body.url;
  if (typeof url !== "string" || !isValidAirbnbUrl(url)) {
    return fail(
      "invalid_url",
      "Provide a valid Airbnb listing link (e.g. airbnb.com/rooms/12345678).",
      400
    );
  }

  const adults =
    typeof body.adults === "number" && body.adults > 0
      ? Math.min(16, Math.round(body.adults))
      : undefined;

  try {
    const scrape = await scrapeAirbnbListing(url, {
      checkIn: isoDateString(body.checkIn),
      checkOut: isoDateString(body.checkOut),
      adults,
    });
    const listing = normalizeScrapedItem(scrape.item, url, scrape.provider);
    return Response.json({ ok: true, listing } satisfies ScrapeResult);
  } catch (error) {
    if (error instanceof ScrapeError) {
      const status =
        error.code === "not_configured"
          ? 503
          : error.code === "provider_limit"
            ? 402
          : error.code === "timeout"
            ? 504
            : 502;
      return fail(error.code, error.message, status);
    }
    return fail("provider_error", "Unexpected error while scraping.", 502);
  }
}
