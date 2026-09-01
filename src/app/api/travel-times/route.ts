import { getDrivingRoute } from "@/lib/google-routes";
import {
  estimateTravelTime,
  type Coordinate,
  type TravelMode,
} from "@/lib/travel-times";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Point extends Coordinate {
  id: string;
}

const MODES = new Set<TravelMode>(["drive", "transit", "walk", "bike"]);

function validPoint(value: unknown): value is Point {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return (
    typeof point.id === "string" &&
    typeof point.lat === "number" &&
    Number.isFinite(point.lat) &&
    Math.abs(point.lat) <= 90 &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lng) <= 180
  );
}

export async function POST(request: Request): Promise<Response> {
  const rate = checkRateLimit(request, "travel-times", {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) return rateLimitResponse(rate);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  const origins = Array.isArray(body.origins)
    ? body.origins.filter(validPoint).slice(0, 5)
    : [];
  const destinations = Array.isArray(body.destinations)
    ? body.destinations.filter(validPoint).slice(0, 10)
    : [];
  const mode =
    typeof body.mode === "string" && MODES.has(body.mode as TravelMode)
      ? (body.mode as TravelMode)
      : null;

  if (!mode || origins.length === 0 || destinations.length === 0) {
    return Response.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  const cells = await Promise.all(
    origins.flatMap((origin) =>
      destinations.map(async (destination) => {
        if (mode === "drive") {
          const route = await getDrivingRoute(origin, destination);
          if (route) {
            return {
              originId: origin.id,
              destinationId: destination.id,
              distanceKm: Math.round(route.distanceKm * 10) / 10,
              durationMinutes: Math.max(1, Math.round(route.durationMinutes)),
              source: "google" as const,
            };
          }
        }
        return {
          originId: origin.id,
          destinationId: destination.id,
          ...estimateTravelTime(origin, destination, mode),
        };
      })
    )
  );

  return Response.json({ ok: true, mode, cells });
}
