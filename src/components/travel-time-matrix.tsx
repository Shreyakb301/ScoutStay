"use client";

import { useEffect, useMemo, useState } from "react";
import { Bike, Bus, Car, Footprints, Loader2, Route } from "lucide-react";

import { Panel } from "@/components/briefing";
import { Button } from "@/components/ui/button";
import type { LngLat } from "@/lib/geocode";
import type { PlaceRef } from "@/lib/trip-intake";
import type { StayListing } from "@/lib/types";
import type { TravelMode, TravelTimeSource } from "@/lib/travel-times";

interface Cell {
  originId: string;
  destinationId: string;
  distanceKm: number;
  durationMinutes: number;
  source: TravelTimeSource;
}

const MODES = [
  { id: "drive" as const, label: "Drive", icon: Car },
  { id: "transit" as const, label: "Transit", icon: Bus },
  { id: "walk" as const, label: "Walk", icon: Footprints },
  { id: "bike" as const, label: "Bike", icon: Bike },
];

export function TravelTimeMatrix({
  stays,
  locations,
  destinations,
}: {
  stays: StayListing[];
  locations: Record<string, LngLat>;
  destinations: PlaceRef[];
}) {
  const [mode, setMode] = useState<TravelMode>("drive");
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const payload = useMemo(
    () => ({
      mode,
      origins: stays.flatMap((stay) => {
        const point = locations[stay.id];
        return point ? [{ id: stay.id, ...point }] : [];
      }),
      destinations: destinations.map((place) => ({
        id: place.id,
        lat: place.latitude,
        lng: place.longitude,
      })),
    }),
    [destinations, locations, mode, stays]
  );

  useEffect(() => {
    if (payload.origins.length === 0 || payload.destinations.length === 0) {
      setCells([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch("/api/travel-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("route request failed");
        return (await response.json()) as { ok: boolean; cells?: Cell[] };
      })
      .then((result) => {
        if (!result.ok || !result.cells) throw new Error("route data missing");
        setCells(result.cells);
      })
      .catch((cause: unknown) => {
        if ((cause as { name?: string }).name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [payload]);

  const lookup = useMemo(
    () =>
      new Map(cells.map((cell) => [`${cell.originId}:${cell.destinationId}`, cell])),
    [cells]
  );
  const totals = stays.map((stay) => ({
    id: stay.id,
    minutes: destinations.reduce(
      (sum, destination) =>
        sum + (lookup.get(`${stay.id}:${destination.id}`)?.durationMinutes ?? 0),
      0
    ),
  }));
  const completeTotals = totals.filter(
    (total) =>
      total.minutes > 0 &&
      destinations.every((destination) =>
        lookup.has(`${total.id}:${destination.id}`)
      )
  );
  const bestId = completeTotals.sort((a, b) => a.minutes - b.minutes)[0]?.id;
  const usesEstimates = cells.some((cell) => cell.source === "estimate");

  return (
    <Panel title="Itinerary travel times" bodyClassName="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" aria-label="Travel mode">
        {MODES.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant={mode === option.id ? "default" : "outline"}
              aria-pressed={mode === option.id}
              onClick={() => setMode(option.id)}
            >
              <Icon className="size-4" /> {option.label}
            </Button>
          );
        })}
      </div>

      {destinations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add planned destinations during trip intake to compare daily travel.
        </p>
      ) : payload.origins.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a complete address or coordinates to at least one stay.
        </p>
      ) : loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <Loader2 className="size-4 animate-spin" /> Calculating routes…
        </p>
      ) : error ? (
        <p className="text-sm text-destructive">Travel-time data is temporarily unavailable.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-foreground text-left">
                <th className="py-2 pr-4">Stay</th>
                {destinations.map((destination) => (
                  <th key={destination.id} className="px-3 py-2 text-right">
                    {destination.name}
                  </th>
                ))}
                <th className="py-2 pl-3 text-right">Trip total</th>
              </tr>
            </thead>
            <tbody>
              {stays.map((stay) => {
                const total = totals.find((item) => item.id === stay.id)?.minutes ?? 0;
                return (
                  <tr key={stay.id} className="border-b border-border">
                    <td className="py-3 pr-4 font-medium">
                      <span className="flex items-center gap-2">
                        {stay.id === bestId ? <Route className="size-4 text-go" /> : null}
                        {stay.name || "Untitled stay"}
                      </span>
                    </td>
                    {destinations.map((destination) => {
                      const cell = lookup.get(`${stay.id}:${destination.id}`);
                      return (
                        <td key={destination.id} className="px-3 py-3 text-right tabular-nums">
                          {cell ? `${cell.durationMinutes} min` : "—"}
                        </td>
                      );
                    })}
                    <td className="py-3 pl-3 text-right font-bold tabular-nums">
                      {total > 0 ? `${total} min` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {cells.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {usesEstimates
            ? "Times marked by this view include geographic estimates based on typical mode speeds; actual traffic, schedules, and routes vary."
            : "Driving times are returned by Google Routes with traffic-unaware routing."}
        </p>
      ) : null}
    </Panel>
  );
}
