import {
  countNearbyPlaces,
  DEFAULT_NEARBY_RADIUS_M,
  fetchNearbyPlaces,
} from "@/lib/nearby-places";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface InputLocation {
  key: string;
  latitude: number;
  longitude: number;
}

function validLocation(value: unknown): value is InputLocation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.key === "string" &&
    typeof item.latitude === "number" &&
    Number.isFinite(item.latitude) &&
    typeof item.longitude === "number" &&
    Number.isFinite(item.longitude)
  );
}

export async function POST(request: Request): Promise<Response> {
  const rate = checkRateLimit(request, "nearby-transit", {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) return rateLimitResponse(rate);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const locations = Array.isArray(body.locations)
    ? body.locations.filter(validLocation).slice(0, 2)
    : [];
  if (locations.length === 0) {
    return Response.json(
      { ok: false, error: "No valid locations supplied." },
      { status: 400 }
    );
  }

  const assessments: Record<
    string,
    { count: number; names: string[]; radiusMeters: number }
  > = {};
  const highlights: Record<
    string,
    {
      radiusMeters: number;
      food: { count: number; names: string[] };
      grocery: { count: number; names: string[] };
      parksAndSights: { count: number; names: string[] };
      nightlife: { count: number; names: string[] };
    }
  > = {};
  const errors: Record<string, string> = {};

  await Promise.all(
    locations.map(async (location) => {
      try {
        const places = await fetchNearbyPlaces(
          location.latitude,
          location.longitude,
          DEFAULT_NEARBY_RADIUS_M
        );
        const transit = places.filter((place) => place.category === "transit");
        const counts = countNearbyPlaces(places);
        const namesFor = (categories: string[]) =>
          places
            .filter((place) => categories.includes(place.category))
            .map((place) => place.name)
            .filter((name): name is string => Boolean(name))
            .slice(0, 3);
        assessments[location.key] = {
          count: counts.transit,
          names: transit
            .map((place) => place.name)
            .filter((name): name is string => Boolean(name))
            .slice(0, 3),
          radiusMeters: DEFAULT_NEARBY_RADIUS_M,
        };
        highlights[location.key] = {
          radiusMeters: DEFAULT_NEARBY_RADIUS_M,
          food: {
            count: counts.restaurant + counts.cafe,
            names: namesFor(["restaurant", "cafe"]),
          },
          grocery: {
            count: counts.grocery,
            names: namesFor(["grocery"]),
          },
          parksAndSights: {
            count: counts.park + counts.attraction,
            names: namesFor(["park", "attraction"]),
          },
          nightlife: {
            count: counts.nightlife,
            names: namesFor(["nightlife"]),
          },
        };
      } catch {
        errors[location.key] = "Transit data unavailable";
      }
    })
  );

  return Response.json({ ok: true, assessments, highlights, errors });
}
