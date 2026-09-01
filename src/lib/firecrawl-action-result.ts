export interface FirecrawlActionListingData {
  amenities: string[];
  expectedCount: number | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  houseRules: string[];
  cancellationInfo: string | null;
  maxGuests: number | null;
  bedrooms: number | null;
  beds: number | null;
  bathrooms: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Parse deterministic values returned by Firecrawl browser actions. */
export function extractFirecrawlActionListingData(
  data: Record<string, unknown>
): FirecrawlActionListingData {
  const actions = isRecord(data.actions) ? data.actions : null;
  const returns = Array.isArray(actions?.javascriptReturns)
    ? actions.javascriptReturns
    : [];

  let expectedCount: number | null = null;
  let amenities: string[] = [];
  let latitude: number | null = null;
  let longitude: number | null = null;
  let locationLabel: string | null = null;
  let houseRules: string[] = [];
  let cancellationInfo: string | null = null;
  let maxGuests: number | null = null;
  let bedrooms: number | null = null;
  let beds: number | null = null;
  let bathrooms: number | null = null;

  for (const rawEntry of returns) {
    const entry = isRecord(rawEntry) ? rawEntry : null;
    let value: unknown = entry?.value;
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        continue;
      }
    }
    const result = isRecord(value) ? value : null;
    if (!result) continue;

    if (typeof result.expectedCount === "number") {
      expectedCount = result.expectedCount;
    }
    if (typeof result.text === "string") {
      const countMatch = result.text.match(/show all\s+(\d+)\s+amenit/i);
      if (countMatch) expectedCount = Number(countMatch[1]);
    }
    if (Array.isArray(result.amenities)) {
      amenities = result.amenities.filter(
        (amenity): amenity is string =>
          typeof amenity === "string" && amenity.trim().length > 0
      );
    }
    if (typeof result.latitude === "number") latitude = result.latitude;
    if (typeof result.longitude === "number") longitude = result.longitude;
    if (typeof result.locationLabel === "string") {
      locationLabel = result.locationLabel;
    }
    if (Array.isArray(result.houseRules)) {
      houseRules = result.houseRules.filter(
        (rule): rule is string =>
          typeof rule === "string" && rule.trim().length > 0
      );
    }
    if (typeof result.cancellationInfo === "string") {
      cancellationInfo = result.cancellationInfo.trim() || null;
    }
    if (typeof result.maxGuests === "number") maxGuests = result.maxGuests;
    if (typeof result.bedrooms === "number") bedrooms = result.bedrooms;
    if (typeof result.beds === "number") beds = result.beds;
    if (typeof result.bathrooms === "number") bathrooms = result.bathrooms;
  }

  return {
    amenities,
    expectedCount,
    latitude,
    longitude,
    locationLabel,
    houseRules,
    cancellationInfo,
    maxGuests,
    bedrooms,
    beds,
    bathrooms,
  };
}
