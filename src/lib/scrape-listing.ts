/**
 * Server-only listing scraper. Firecrawl is the only provider. Imported
 * exclusively by the API route so provider
 * credentials are never bundled into client code.
 */

import "server-only";

import { extractFirecrawlActionListingData } from "@/lib/firecrawl-action-result";
import type { ScrapeErrorCode } from "@/lib/scrape-types";

const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape";
// Firecrawl's documented default is 60 seconds. Structured extraction can
// take longer than a plain scrape, especially on Airbnb's client-rendered UI.
const FIRECRAWL_PROVIDER_TIMEOUT_MS = 75_000;
const FIRECRAWL_REQUEST_TIMEOUT_MS = 85_000;

/**
 * Airbnb renders only a short amenity preview in the page body. The complete
 * list is mounted in a dialog after the "Show all … amenities" button is
 * clicked, so structured extraction must run against that expanded DOM.
 */
const EXPAND_AIRBNB_AMENITIES_SCRIPT = `
(() => {
  const buttons = Array.from(document.querySelectorAll("button"));
  const trigger = buttons.find((button) => {
    const text = (button.textContent || "").replace(/\\s+/g, " ").trim();
    return /show all .*amenit/i.test(text);
  });
  if (!trigger) return { clicked: false };
  trigger.scrollIntoView({ block: "center", inline: "nearest" });
  trigger.click();
  return { clicked: true, text: trigger.textContent?.trim() || "" };
})()
`;

const EXTRACT_AIRBNB_AMENITIES_SCRIPT = `
(() => {
  const trigger = Array.from(document.querySelectorAll('button')).find((button) =>
    /show all .*amenit/i.test((button.textContent || '').replace(/\\s+/g, ' ').trim())
  );
  const match = trigger?.textContent?.match(/show all\\s+(\\d+)\\s+amenit/i);
  const expectedCount = match ? Number(match[1]) : null;
  const rental = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .flatMap((script) => {
      try {
        const parsed = JSON.parse(script.textContent || 'null');
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    })
    .find((item) => item && item['@type'] === 'VacationRental');
  const location = {
    latitude: typeof rental?.latitude === 'number' ? rental.latitude : null,
    longitude: typeof rental?.longitude === 'number' ? rental.longitude : null,
    locationLabel:
      typeof rental?.address?.addressLocality === 'string'
        ? rental.address.addressLocality
        : null,
  };
  const pageText = document.body?.innerText || '';
  const firstCount = (pattern) => {
    const match = pageText.match(pattern);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  };
  const propertyDetails = {
    maxGuests: firstCount(/\b(\d+(?:\.\d+)?)\s+guests?\b/i),
    bedrooms: firstCount(/\b(\d+(?:\.\d+)?)\s+bedrooms?\b/i),
    beds: firstCount(/\b(\d+(?:\.\d+)?)\s+beds?\b/i),
    bathrooms: firstCount(/\b(\d+(?:\.\d+)?)\s+(?:baths?|bathrooms?)\b/i),
  };
  // Dated Airbnb URLs can render a calendar/pricing element with
  // role="dialog" before the amenity modal. Select the dialog by its visible
  // heading instead of assuming the first dialog belongs to amenities.
  const dialog = Array.from(document.querySelectorAll('[role="dialog"]')).find(
    (candidate) => /what this place offers/i.test(candidate.textContent || '')
  );
  if (!dialog) return { amenities: [], expectedCount, ...location, ...propertyDetails };
  const rows = Array.from(dialog.querySelectorAll('ul > li')).filter((row) => {
    const list = row.closest('ul');
    return list?.getAttribute('aria-label') !== 'Not included';
  });
  const amenities = Array.from(new Set(
    rows
      .map((row) => (row.innerText || '').split('\\n')[0]?.trim() || '')
      .filter(Boolean)
  ));

  return {
    amenities,
    expectedCount,
    ...location,
    ...propertyDetails,
  };
})()
`;

const CLOSE_AIRBNB_AMENITIES_SCRIPT = `
(() => {
  const dialog = Array.from(document.querySelectorAll('[role="dialog"]')).find(
    (candidate) => /what this place offers/i.test(candidate.textContent || '')
  );
  const close = dialog?.querySelector('button[aria-label*="close" i]');
  if (!(close instanceof HTMLElement)) return { closed: false };
  close.click();
  return { closed: true };
})()
`;

/** Read the public summaries in Airbnb's “Things to know” cards. */
const EXTRACT_AIRBNB_RULES_SCRIPT = `
(() => {
  const cleanLines = (text) => Array.from(new Set(
    (text || '')
      .split('\\n')
      .map((line) => line.replace(/\\s+/g, ' ').trim())
      .filter(Boolean)
      .filter((line) => !/^(show more|things to know|house rules|cancellation policy)$/i.test(line))
  ));
  const findCardLines = (headingText) => {
    const heading = Array.from(document.querySelectorAll('h2,h3,h4')).find(
      (node) => node.textContent?.trim().toLowerCase() === headingText.toLowerCase()
    );
    if (!heading) return [];
    let candidate = heading.parentElement;
    let best = cleanLines(candidate?.innerText || '');
    for (let level = 0; candidate?.parentElement && level < 4; level += 1) {
      candidate = candidate.parentElement;
      const lines = cleanLines(candidate.innerText || '');
      const length = lines.join(' ').length;
      if (lines.length > best.length && length < 900) best = lines;
    }
    return best.filter((line) => line.toLowerCase() !== headingText.toLowerCase());
  };

  return {
    houseRules: findCardLines('House rules'),
    cancellationInfo: findCardLines('Cancellation policy').join(' · ') || null,
  };
})()
`;

export type ScrapeProvider = "firecrawl";

export interface ListingScrape {
  item: unknown;
  provider: ScrapeProvider;
}

export class ScrapeError extends Error {
  code: ScrapeErrorCode;
  constructor(code: ScrapeErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ScrapeError";
  }
}

function isoDate(daysFromNow: number): string {
  const d = new Date(Date.now() + daysFromNow * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export interface ScrapeOptions {
  /** ISO YYYY-MM-DD trip dates and guest count, from the trip intake. */
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}

/** Apply dates and guests because Airbnb uses them to surface a nightly rate. */
function withStayParams(rawUrl: string, opts: ScrapeOptions = {}): string {
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("check_in"))
      url.searchParams.set("check_in", opts.checkIn || isoDate(45));
    if (!url.searchParams.has("check_out"))
      url.searchParams.set("check_out", opts.checkOut || isoDate(48));
    if (!url.searchParams.has("adults"))
      url.searchParams.set("adults", String(opts.adults || 2));
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasUsableListingData(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return [
    "title",
    "pricePerNight",
    "address",
    "city",
    "description",
    "amenities",
  ].some((key) => {
    const field = value[key];
    if (Array.isArray(field)) return field.length > 0;
    if (typeof field === "string") return field.trim().length > 0;
    return field !== null && field !== undefined;
  });
}

function errorMessage(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  if (typeof body.error === "string") return body.error;
  if (isRecord(body.error) && typeof body.error.message === "string") {
    return body.error.message;
  }
  return typeof body.message === "string" ? body.message : undefined;
}

async function scrapeWithFirecrawl(
  url: string,
  opts: ScrapeOptions
): Promise<unknown> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new ScrapeError("not_configured", "Firecrawl is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(FIRECRAWL_SCRAPE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: withStayParams(url, opts),
        // The comparison milestone needs the title and amenity rows only. A
        // model-generated JSON format adds substantial latency and can
        // paraphrase or omit rows, so use the browser action return instead.
        formats: ["markdown"],
        onlyMainContent: false,
        waitFor: 2_000,
        actions: [
          {
            type: "executeJavascript",
            script: EXPAND_AIRBNB_AMENITIES_SCRIPT,
          },
          { type: "wait", milliseconds: 5_000 },
          {
            type: "executeJavascript",
            script: EXTRACT_AIRBNB_AMENITIES_SCRIPT,
          },
          {
            type: "executeJavascript",
            script: CLOSE_AIRBNB_AMENITIES_SCRIPT,
          },
          { type: "wait", milliseconds: 1_000 },
          {
            type: "executeJavascript",
            script: EXTRACT_AIRBNB_RULES_SCRIPT,
          },
        ],
        timeout: FIRECRAWL_PROVIDER_TIMEOUT_MS,
        location: { country: "US", languages: ["en-US"] },
        proxy: "auto",
        // Interactive actions force a fresh browser session in Firecrawl.
        maxAge: 0,
        storeInCache: false,
      }),
      signal: AbortSignal.timeout(FIRECRAWL_REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ScrapeError("timeout", "Firecrawl timed out.");
    }
    throw new ScrapeError("provider_error", "Could not reach Firecrawl.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ScrapeError("provider_error", "Firecrawl returned invalid data.");
  }

  if (response.status === 408 || response.status === 504) {
    throw new ScrapeError("timeout", "Firecrawl timed out.");
  }
  if (response.status === 402 || response.status === 429) {
    throw new ScrapeError(
      "provider_limit",
      errorMessage(body) || "Firecrawl usage or rate limit reached."
    );
  }
  if (!response.ok) {
    throw new ScrapeError(
      "provider_error",
      errorMessage(body) || `Firecrawl returned ${response.status}.`
    );
  }

  const data = isRecord(body) && isRecord(body.data) ? body.data : null;
  const actionAmenities = data
    ? extractFirecrawlActionListingData(data)
    : null;
  const metadata = data && isRecord(data.metadata) ? data.metadata : null;
  const item = {
    title:
      (typeof metadata?.title === "string" && metadata.title.trim()) ||
      "Airbnb listing",
    amenities: actionAmenities?.amenities ?? [],
    amenitiesExpectedCount: actionAmenities?.expectedCount ?? null,
    latitude: actionAmenities?.latitude ?? null,
    longitude: actionAmenities?.longitude ?? null,
    city: actionAmenities?.locationLabel ?? null,
    houseRules: actionAmenities?.houseRules ?? [],
    cancellationPolicy: actionAmenities?.cancellationInfo ?? null,
    maxGuests: actionAmenities?.maxGuests ?? null,
    bedrooms: actionAmenities?.bedrooms ?? null,
    beds: actionAmenities?.beds ?? null,
    bathrooms: actionAmenities?.bathrooms ?? null,
  };
  if (!hasUsableListingData(item) || item.amenities.length === 0) {
    throw new ScrapeError(
      "no_data",
      "Firecrawl did not return usable listing data."
    );
  }
  return item;
}

/** Scrape one Airbnb listing with Firecrawl. */
export async function scrapeAirbnbListing(
  url: string,
  opts: ScrapeOptions = {}
): Promise<ListingScrape> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new ScrapeError(
      "not_configured",
      "Scraping is not configured. Set FIRECRAWL_API_KEY."
    );
  }
  return {
    item: await scrapeWithFirecrawl(url, opts),
    provider: "firecrawl",
  };
}
