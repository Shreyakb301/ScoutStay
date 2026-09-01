import {
  getAirportIntelligence,
  type AirportIntelligence,
} from "@/lib/airport-intelligence";
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
    Math.abs(item.latitude) <= 90 &&
    typeof item.longitude === "number" &&
    Number.isFinite(item.longitude) &&
    Math.abs(item.longitude) <= 180
  );
}

export async function POST(request: Request): Promise<Response> {
  const rate = checkRateLimit(request, "nearby-airports", {
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

  const airports: Record<string, AirportIntelligence | null> = {};
  const errors: Record<string, string> = {};

  await Promise.all(
    locations.map(async (location) => {
      try {
        airports[location.key] = await getAirportIntelligence(
          location.latitude,
          location.longitude
        );
      } catch {
        errors[location.key] = "Airport data unavailable";
      }
    })
  );

  return Response.json({ ok: true, airports, errors });
}
