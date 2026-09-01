"use client";

import { useMemo, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  BedDouble,
  Bus,
  ClipboardCheck,
  ExternalLink,
  Loader2,
  Martini,
  MapPin,
  Pencil,
  Plane,
  Plus,
  RotateCcw,
  ScrollText,
  ShoppingBasket,
  Trees,
  TriangleAlert,
  Utensils,
  X,
} from "lucide-react";

import { Panel } from "@/components/briefing";
import { PlaceAutocomplete } from "@/components/place-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  compareAmenityLists,
  normalizeAmenityLabel,
  normalizeAmenityList,
} from "@/lib/amenity-comparison";
import {
  useTransitAssessment,
  type NeighborhoodHighlights,
} from "@/hooks/use-transit-assessment";
import { useAirportIntelligence } from "@/hooks/use-airport-intelligence";
import type { LngLat } from "@/lib/geocode";
import type { AirportIntelligence } from "@/lib/airport-intelligence";
import { isValidAirbnbUrl } from "@/lib/listing-normalizer";
import sampleAirbnbData from "@/lib/sample-airbnb-data.json";
import type { Confidence, NormalizedListing, ScrapeResult } from "@/lib/scrape-types";
import type { PlaceRef } from "@/lib/trip-intake";
import { cn } from "@/lib/utils";

const ComparisonLocationMap = dynamic(
  () =>
    import("@/components/comparison-location-map").then(
      (module) => module.ComparisonLocationMap
    ),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse bg-muted sm:h-80" />,
  }
);

type SlotStatus = "idle" | "loading" | "error" | "review" | "confirmed";

interface ListingSlot {
  key: "A" | "B";
  url: string;
  status: SlotStatus;
  listing?: NormalizedListing;
  name: string;
  amenities: string[];
  error?: string;
  source?: "firecrawl" | "sample" | "manual";
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  bookingRequirements: string[];
  houseRules: string[];
  sampleAirport?: AirportIntelligence;
  sampleNeighborhood?: NeighborhoodHighlights;
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
}

function initialSlot(key: "A" | "B"): ListingSlot {
  return {
    key,
    url: "",
    status: "idle",
    name: "",
    amenities: [],
    bookingRequirements: [],
    houseRules: [],
  };
}

function textItems(value?: string | null): string[] {
  return value
    ? value
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function canonicalUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase();
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

function confidenceLabel(confidence?: Confidence): string {
  if (!confidence) return "Manual review";
  return `${confidence[0].toUpperCase()}${confidence.slice(1)} confidence`;
}

function transitLabel(count: number): string {
  if (count === 0) return "No mapped stops nearby";
  if (count < 3) return "Limited nearby transit";
  if (count < 8) return "Several nearby options";
  return "Strong nearby coverage";
}

function countLabel(
  value: number | undefined,
  singular: string,
  plural: string
): string | null {
  if (typeof value !== "number") return null;
  return `${value} ${value === 1 ? singular : plural}`;
}

function propertyDetailItems(slot: ListingSlot): string[] {
  return [
    countLabel(slot.maxGuests, "guest", "guests"),
    countLabel(slot.bedrooms, "bedroom", "bedrooms"),
    countLabel(slot.beds, "bed", "beds"),
    countLabel(slot.bathrooms, "bath", "baths"),
  ].filter((item): item is string => item !== null);
}

function plainComparisonKey(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function comparePlainLists(a: string[], b: string[]) {
  const uniqueByKey = (values: string[]) => {
    const result = new Map<string, string>();
    for (const value of values) {
      const label = value.trim();
      const key = plainComparisonKey(label);
      if (key && !result.has(key)) result.set(key, label);
    }
    return result;
  };
  const mapA = uniqueByKey(a);
  const mapB = uniqueByKey(b);
  return {
    common: [...mapA].filter(([key]) => mapB.has(key)).map(([, label]) => label),
    onlyA: [...mapA].filter(([key]) => !mapB.has(key)).map(([, label]) => label),
    onlyB: [...mapB].filter(([key]) => !mapA.has(key)).map(([, label]) => label),
  };
}

function ThingsComparison({
  title,
  icon: Icon,
  slots,
  values,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  slots: [ListingSlot, ListingSlot];
  values: (slot: ListingSlot) => string[];
}) {
  const comparison = comparePlainLists(values(slots[0]), values(slots[1]));
  const commonLabel = `Common ${title.toLocaleLowerCase()}`;

  return (
    <article className="overflow-hidden border-2 border-foreground bg-card">
      <div className="flex items-center gap-2 border-b-2 border-foreground bg-muted/50 px-4 py-3">
        <Icon className="size-4 text-signal" />
        <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
      </div>

      <div className="border-b-2 border-foreground bg-go/[0.04] p-4">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
          <span className="flex size-5 items-center justify-center bg-go text-white">
            <Check className="size-3.5" />
          </span>
          {commonLabel}
        </h4>
        {comparison.common.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {comparison.common.map((item) => (
              <li key={item} className="border border-go/25 bg-card px-2 py-1 text-xs">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">None listed in common</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2">
        {slots.map((slot, index) => {
          const unique = index === 0 ? comparison.onlyA : comparison.onlyB;
          return (
            <div
              key={slot.key}
              className={cn(
                "p-4",
                index === 0 && "border-b-2 border-foreground sm:border-b-0 sm:border-r-2"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "data flex size-7 shrink-0 items-center justify-center text-xs font-bold",
                    index === 0
                      ? "bg-signal text-signal-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {slot.key}
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wide">
                  Only Airbnb {slot.key}
                </h4>
              </div>
              {unique.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {unique.map((item) => (
                    <li
                      key={item}
                      className={cn(
                        "border px-2 py-1 text-xs",
                        index === 0
                          ? "border-signal/30 bg-signal/10"
                          : "border-border bg-muted/60"
                      )}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No unique items</p>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function AmenityReviewCard({
  slot,
  onChange,
  onConfirm,
  onRetry,
  onManual,
}: {
  slot: ListingSlot;
  onChange: (patch: Partial<ListingSlot>) => void;
  onConfirm: () => void;
  onRetry: () => void;
  onManual: () => void;
}) {
  const [newAmenity, setNewAmenity] = useState("");
  const amenityWarnings =
    slot.listing?.warnings.filter((warning) =>
      /amenit|firecrawl|entered manually/i.test(warning)
    ) ?? [];

  const addAmenity = () => {
    const label = normalizeAmenityLabel(newAmenity);
    if (!label) return;
    onChange({ amenities: normalizeAmenityList([...slot.amenities, label]) });
    setNewAmenity("");
  };

  if (slot.status === "loading") {
    return (
      <Panel bodyClassName="flex min-h-44 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <Loader2 className="size-6 animate-spin text-signal" />
          <div>
            <p className="font-semibold">Importing Airbnb {slot.key}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Firecrawl is reading the listing and its amenities.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  if (slot.status === "error") {
    return (
      <Panel bodyClassName="flex min-h-44 flex-col justify-between gap-5 p-5">
        <div>
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <TriangleAlert className="size-4" />
            Airbnb {slot.key} could not be imported
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{slot.error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You can retry Firecrawl or enter the amenity list manually.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onRetry}>
            Retry Firecrawl
          </Button>
          <Button type="button" onClick={onManual}>
            Review manually
          </Button>
        </div>
      </Panel>
    );
  }

  if (slot.status === "confirmed") {
    return (
      <Panel bodyClassName="flex min-h-44 flex-col justify-between gap-4 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Airbnb {slot.key} confirmed</p>
              <h3 className="mt-1 text-lg font-semibold">{slot.name}</h3>
            </div>
            <span className="inline-flex items-center gap-1 border border-go/40 px-2 py-1 text-xs text-go">
              <Check className="size-3.5" /> Reviewed
            </span>
          </div>
          <p className="mt-3 data text-sm">
            {slot.amenities.length} {slot.amenities.length === 1 ? "amenity" : "amenities"}
          </p>
        </div>
        <Button type="button" variant="outline" className="self-start" onClick={() => onChange({ status: "review" })}>
          <Pencil className="size-4" /> Edit amenities
        </Button>
      </Panel>
    );
  }

  if (slot.status !== "review") return null;

  return (
    <Panel
      title={`Review Airbnb ${slot.key}`}
      aside={
        <span className="eyebrow">
          {slot.source === "sample"
            ? "Saved sample"
            : confidenceLabel(slot.listing?.amenities.confidence)}
        </span>
      }
      bodyClassName="flex flex-col gap-5 p-5"
    >
      {amenityWarnings.length > 0 && (
        <div className="border-l-2 border-caution pl-3">
          <p className="eyebrow text-caution">Check extracted data</p>
          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
            {amenityWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`listing-${slot.key}-name`}>Listing name</Label>
        <Input
          id={`listing-${slot.key}-name`}
          value={slot.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder={`Airbnb ${slot.key}`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <Label>
            {slot.source === "sample"
              ? "Saved sample amenities"
              : "Amenities Firecrawl found"}
          </Label>
          <span className="data text-xs text-muted-foreground">
            {slot.amenities.length} total
          </span>
        </div>
        {slot.amenities.length === 0 ? (
          <p className="mt-2 border border-dashed border-border p-3 text-sm text-muted-foreground">
            No amenities were extracted. Add the amenities visible on the Airbnb page before confirming.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Airbnb ${slot.key} amenities`}>
            {slot.amenities.map((amenity) => (
              <li key={amenity} className="inline-flex items-center gap-1.5 border border-border bg-background px-2 py-1 text-sm">
                <span>{amenity}</span>
                <button
                  type="button"
                  onClick={() => onChange({ amenities: slot.amenities.filter((item) => item !== amenity) })}
                  className="text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Remove ${amenity} from Airbnb ${slot.key}`}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`listing-${slot.key}-new-amenity`}>Add a missing amenity</Label>
        <div className="flex gap-2">
          <Input
            id={`listing-${slot.key}-new-amenity`}
            value={newAmenity}
            onChange={(event) => setNewAmenity(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addAmenity();
              }
            }}
            placeholder="e.g. Pool"
          />
          <Button type="button" variant="outline" onClick={addAmenity} disabled={!newAmenity.trim()}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <a
          href={slot.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4"
        >
          Check Airbnb page <ExternalLink className="size-3.5" />
        </a>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={!slot.name.trim() || slot.amenities.length === 0}
        >
          Confirm amenities
        </Button>
      </div>
    </Panel>
  );
}

function AmenityResults({
  slots,
  visitPlaces,
  onVisitPlacesChange,
  onEdit,
  onStartOver,
}: {
  slots: [ListingSlot, ListingSlot];
  visitPlaces: PlaceRef[];
  onVisitPlacesChange: (places: PlaceRef[]) => void;
  onEdit: () => void;
  onStartOver: () => void;
}) {
  const comparison = useMemo(
    () => compareAmenityLists(slots[0].amenities, slots[1].amenities),
    [slots]
  );
  const locations = useMemo<Record<string, LngLat>>(
    () =>
      Object.fromEntries(
        slots.flatMap((slot) =>
          typeof slot.latitude === "number" &&
          typeof slot.longitude === "number"
            ? [[slot.key, { lat: slot.latitude, lng: slot.longitude }]]
            : []
        )
      ),
    [slots]
  );
  const transit = useTransitAssessment(locations);
  const airportLookupLocations = useMemo<Record<string, LngLat>>(
    () =>
      Object.fromEntries(
        Object.entries(locations).filter(
          ([key]) => !slots.find((slot) => slot.key === key)?.sampleAirport
        )
      ),
    [locations, slots]
  );
  const airportState = useAirportIntelligence(airportLookupLocations);
  const airports = useMemo<Record<string, AirportIntelligence | null>>(
    () => ({
      ...airportState.airports,
      ...Object.fromEntries(
        slots.flatMap((slot) =>
          slot.sampleAirport ? [[slot.key, slot.sampleAirport]] : []
        )
      ),
    }),
    [airportState.airports, slots]
  );
  const neighborhoodHighlights = useMemo<Record<string, NeighborhoodHighlights>>(
    () => ({
      ...transit.highlights,
      ...Object.fromEntries(
        slots.flatMap((slot) =>
          slot.sampleNeighborhood ? [[slot.key, slot.sampleNeighborhood]] : []
        )
      ),
    }),
    [transit.highlights, slots]
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="border-b-4 border-foreground pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-tight">
              Amenities
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onEdit}>
              <Pencil className="size-4" /> Edit listings
            </Button>
            <Button type="button" variant="outline" onClick={onStartOver}>
              <RotateCcw className="size-4" /> Start over
            </Button>
          </div>
        </div>
      </div>

      <section
        aria-label="Amenities comparison"
        className="grid overflow-hidden border-2 border-foreground bg-card sm:grid-cols-2"
      >
        <article className="border-b-2 border-foreground bg-go/[0.04] p-4 sm:col-span-2 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
              <span className="flex size-6 items-center justify-center bg-go text-white">
                <Check className="size-4" />
              </span>
              Common amenities
            </h3>
          </div>
          {comparison.common.length > 0 ? (
            <>
              <p className="mt-3 text-sm leading-6 sm:hidden">
                {comparison.common.join(" · ")}
              </p>
              <ul className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
                {comparison.common.map((amenity) => (
                  <li key={amenity} className="border border-go/25 bg-card px-2 py-1 text-xs">
                    {amenity}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No common amenities</p>
          )}
        </article>

        {slots.map((slot, index) => {
          const amenities = index === 0 ? comparison.onlyA : comparison.onlyB;
          return (
            <article
              key={slot.key}
              className={cn(
                "border-b border-border p-4 sm:border-b-0 sm:p-5",
                index === 0 && "sm:border-r-2 sm:border-foreground"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "data flex size-8 shrink-0 items-center justify-center text-sm font-bold",
                      index === 0
                        ? "bg-signal text-signal-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {slot.key}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold uppercase tracking-wide">
                      Only Airbnb {slot.key}
                    </h3>
                    <a
                      href={slot.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      <span>{slot.name}</span>
                      <ExternalLink className="mt-0.5 size-3 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
              {amenities.length > 0 ? (
                <>
                  <p className="mt-3 text-sm leading-6 sm:hidden">
                    {amenities.join(" · ")}
                  </p>
                  <ul className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
                    {amenities.map((amenity) => (
                      <li
                        key={amenity}
                        className={cn(
                          "border px-2 py-1 text-xs",
                          index === 0
                            ? "border-signal/30 bg-signal/10"
                            : "border-border bg-muted/60"
                        )}
                      >
                        {amenity}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No unique amenities</p>
              )}
            </article>
          );
        })}
      </section>

      <section aria-labelledby="property-details-heading" className="mt-3">
        <div className="border-b-2 border-foreground pb-2">
          <h2
            id="property-details-heading"
            className="text-2xl font-bold uppercase tracking-tight"
          >
            Property details
          </h2>
        </div>
        <div className="mt-4">
          <ThingsComparison
            title="Space and capacity"
            icon={BedDouble}
            slots={slots}
            values={propertyDetailItems}
          />
        </div>
      </section>

      <section aria-labelledby="location-heading" className="mt-3">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-foreground pb-2">
          <h2 id="location-heading" className="text-2xl font-bold uppercase tracking-tight">
            Location
          </h2>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {slots.map((slot, index) => {
            const airport = airports[slot.key];
            return (
            <div key={slot.key} className="flex min-w-0 items-start gap-3 border border-border bg-card p-3">
              <span
                className={cn(
                  "data flex size-8 shrink-0 items-center justify-center text-sm font-bold",
                  index === 0
                    ? "bg-signal text-signal-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {slot.key}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{slot.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {slot.locationLabel ?? "Approximate location unavailable"}
                </p>
                {airport ? (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium">
                    <Plane className="size-3 text-signal" />
                    {airport.distanceKm} km · {airport.source === "estimate" ? "~" : ""}
                    {airport.driveMinutes} min to {airport.airport.iata ?? airport.airport.name}
                  </p>
                ) : airportState.loading && locations[slot.key] ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Calculating airport distance…
                  </p>
                ) : null}
              </div>
            </div>
            );
          })}
        </div>

        <div className="mt-3 border border-border bg-card p-3">
          <Label htmlFor="comparison-visit-place" className="text-sm font-bold uppercase tracking-wide">
            Places to visit
          </Label>
          <div className="mt-2">
            <PlaceAutocomplete
              id="comparison-visit-place"
              placeholder="Search and add a place…"
              clearOnSelect
              onSelect={(place) => {
                if (visitPlaces.some((current) => current.id === place.id)) return;
                onVisitPlacesChange([...visitPlaces, place]);
              }}
            />
          </div>
          {visitPlaces.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {visitPlaces.map((place) => (
                <div
                  key={place.id}
                  className="flex min-w-0 items-center gap-2 border border-border bg-muted/40 px-2 py-1.5"
                >
                  <span className="min-w-0 truncate text-xs font-medium">
                    📍 {place.name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onVisitPlacesChange(
                        visitPlaces.filter((current) => current.id !== place.id)
                      )
                    }
                    aria-label={`Remove ${place.name}`}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-2">
          <ComparisonLocationMap
            airports={airports}
            airportErrors={airportState.errors}
            airportLoading={airportState.loading}
            visitPlaces={visitPlaces}
            points={slots.map((slot) => ({
              key: slot.key,
              name: slot.name,
              url: slot.url,
              latitude: slot.latitude,
              longitude: slot.longitude,
              locationLabel: slot.locationLabel,
            }))}
          />
        </div>
      </section>

      <section aria-labelledby="assessment-heading" className="mt-3">
        <div className="border-b-2 border-foreground pb-2">
          <h2 id="assessment-heading" className="text-2xl font-bold uppercase tracking-tight">
            Assessment
          </h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {slots.map((slot, index) => {
            const info = transit.assessments[slot.key];
            const error = transit.errors[slot.key];

            return (
              <article key={slot.key} className="border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center",
                      index === 0
                        ? "bg-signal text-signal-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <Bus className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow">Airbnb {slot.key} · Transit</p>
                    {transit.loading && !info ? (
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" /> Checking OpenStreetMap…
                      </p>
                    ) : error || !info ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Transit data unavailable
                      </p>
                    ) : (
                      <>
                        <p className="mt-1 text-lg font-bold">
                          {info.count} mapped stops or stations
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {transitLabel(info.count)} within {info.radiusMeters} m.
                        </p>
                        {info.names.length > 0 ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Nearby: {info.names.join(" · ")}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="neighborhood-heading" className="mt-3">
        <div className="border-b-2 border-foreground pb-2">
          <h2
            id="neighborhood-heading"
            className="text-2xl font-bold uppercase tracking-tight"
          >
            Neighborhood highlights
          </h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {slots.map((slot, index) => {
            const highlights = neighborhoodHighlights[slot.key];
            const categories = highlights
              ? [
                  { key: "food", label: "Food & cafés", icon: Utensils, value: highlights.food },
                  { key: "grocery", label: "Groceries", icon: ShoppingBasket, value: highlights.grocery },
                  { key: "parks", label: "Parks & sights", icon: Trees, value: highlights.parksAndSights },
                  { key: "nightlife", label: "Nightlife", icon: Martini, value: highlights.nightlife },
                ]
              : [];

            return (
              <article key={slot.key} className="overflow-hidden border border-border bg-card">
                <div className="flex items-center gap-3 border-b border-border bg-muted/50 p-3">
                  <span
                    className={cn(
                      "data flex size-8 shrink-0 items-center justify-center text-sm font-bold",
                      index === 0
                        ? "bg-signal text-signal-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {slot.key}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{slot.name}</p>
                    {highlights ? (
                      <p className="text-xs text-muted-foreground">
                        Within {highlights.radiusMeters} m
                      </p>
                    ) : null}
                  </div>
                </div>

                {transit.loading && !highlights ? (
                  <p className="flex min-h-40 items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Checking nearby places…
                  </p>
                ) : !highlights ? (
                  <p className="min-h-40 p-4 text-sm text-muted-foreground">
                    Neighborhood data unavailable
                  </p>
                ) : (
                  <div className="grid grid-cols-2">
                    {categories.map((category, categoryIndex) => {
                      const Icon = category.icon;
                      return (
                        <div
                          key={category.key}
                          className={cn(
                            "min-w-0 p-3",
                            categoryIndex % 2 === 0 && "border-r border-border",
                            categoryIndex < 2 && "border-b border-border"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-semibold">
                              <Icon className="size-3.5 text-signal" /> {category.label}
                            </span>
                            <span className="data text-sm font-bold">{category.value.count}</span>
                          </div>
                          <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            {category.value.names.length > 0
                              ? category.value.names.join(" · ")
                              : "No named places listed"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="things-to-know-heading" className="mt-3">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-foreground pb-2">
          <h2
            id="things-to-know-heading"
            className="text-2xl font-bold uppercase tracking-tight"
          >
            Things to know
          </h2>
        </div>

        <div className="mt-4 grid gap-4">
          <ThingsComparison
            title="Booking requirements"
            icon={ClipboardCheck}
            slots={slots}
            values={(slot) => slot.bookingRequirements}
          />
          <ThingsComparison
            title="Hotel / house rules"
            icon={ScrollText}
            slots={slots}
            values={(slot) => slot.houseRules}
          />
        </div>
      </section>
    </div>
  );
}

export function CompareForm() {
  const [slots, setSlots] = useState<[ListingSlot, ListingSlot]>([
    initialSlot("A"),
    initialSlot("B"),
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [visitPlaces, setVisitPlaces] = useState<PlaceRef[]>([]);

  const updateSlot = (index: 0 | 1, patch: Partial<ListingSlot>) => {
    setSlots((current) => {
      const next = [...current] as [ListingSlot, ListingSlot];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const importSlot = async (index: 0 | 1, url: string) => {
    updateSlot(index, {
      url: url.trim(),
      status: "loading",
      listing: undefined,
      name: "",
      amenities: [],
      error: undefined,
      latitude: undefined,
      longitude: undefined,
      locationLabel: undefined,
      bookingRequirements: [],
      houseRules: [],
      sampleAirport: undefined,
      sampleNeighborhood: undefined,
      maxGuests: undefined,
      bedrooms: undefined,
      beds: undefined,
      bathrooms: undefined,
    });
    try {
      const response = await fetch("/api/scrape-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const result = (await response.json()) as ScrapeResult;
      if (!result.ok) {
        updateSlot(index, { status: "error", error: result.error });
        return;
      }
      updateSlot(index, {
        status: "review",
        listing: result.listing,
        name: result.listing.name.value ?? `Airbnb ${index === 0 ? "A" : "B"}`,
        amenities: normalizeAmenityList(result.listing.amenities.value),
        source: "firecrawl",
        latitude: result.listing.latitude.value ?? undefined,
        longitude: result.listing.longitude.value ?? undefined,
        locationLabel:
          result.listing.city.value ?? result.listing.region.value ?? undefined,
        bookingRequirements: [
          ...textItems(result.listing.checkInInfo.value),
          ...textItems(result.listing.cancellationInfo.value),
        ],
        houseRules: textItems(result.listing.houseRules.value),
        maxGuests: result.listing.maxGuests.value ?? undefined,
        bedrooms: result.listing.bedrooms.value ?? undefined,
        beds: result.listing.beds.value ?? undefined,
        bathrooms: result.listing.bathrooms.value ?? undefined,
      });
    } catch {
      updateSlot(index, {
        status: "error",
        error: "ScoutStay could not reach the Firecrawl import endpoint.",
      });
    }
  };

  const importBoth = async () => {
    setFormError(null);
    const [a, b] = slots;
    if (!isValidAirbnbUrl(a.url) || !isValidAirbnbUrl(b.url)) {
      setFormError("Enter two valid Airbnb room links before importing.");
      return;
    }
    if (canonicalUrl(a.url) === canonicalUrl(b.url)) {
      setFormError("Airbnb A and Airbnb B must be different listings.");
      return;
    }
    await Promise.all([importSlot(0, a.url), importSlot(1, b.url)]);
  };

  const startOver = () => {
    setSlots([initialSlot("A"), initialSlot("B")]);
    setFormError(null);
    setShowResults(false);
    setVisitPlaces([]);
  };

  const loadSampleData = () => {
    setSlots(
      sampleAirbnbData.map((sample) => ({
        key: sample.key as "A" | "B",
        url: sample.url,
        status: "review" as const,
        name: sample.name,
        amenities: normalizeAmenityList(sample.amenities),
        source: "sample" as const,
        latitude: sample.latitude,
        longitude: sample.longitude,
        locationLabel: sample.locationLabel,
        bookingRequirements: sample.bookingRequirements,
        houseRules: sample.houseRules,
        sampleAirport: sample.airport as AirportIntelligence,
        sampleNeighborhood:
          sample.neighborhoodHighlights as NeighborhoodHighlights,
        maxGuests: sample.maxGuests,
        bedrooms: sample.bedrooms,
        beds: sample.beds,
        bathrooms: sample.bathrooms,
      })) as [ListingSlot, ListingSlot]
    );
    setFormError(null);
    setShowResults(false);
    setVisitPlaces([]);
  };

  if (showResults) {
    return (
      <AmenityResults
        slots={slots}
        visitPlaces={visitPlaces}
        onVisitPlacesChange={setVisitPlaces}
        onEdit={() => setShowResults(false)}
        onStartOver={startOver}
      />
    );
  }

  const hasImportState = slots.some((slot) => slot.status !== "idle");
  const canCompare = slots.every((slot) => slot.status === "confirmed");
  const importing = slots.some((slot) => slot.status === "loading");

  return (
    <div className="flex flex-col gap-8">
      <section className="panel p-5 sm:p-6" aria-labelledby="listing-links-heading">
        <div className="border-b border-border pb-4">
          <p className="eyebrow">Step 01</p>
          <h2 id="listing-links-heading" className="mt-1 text-xl font-bold uppercase tracking-wide">
            Paste two Airbnb links
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            ScoutStay uses Firecrawl to read each public listing. You will review every amenity before the comparison is created.
          </p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {slots.map((slot, index) => {
            const valid = isValidAirbnbUrl(slot.url);
            return (
              <div key={slot.key} className="grid gap-2">
                <Label htmlFor={`airbnb-${slot.key}-url`}>Airbnb {slot.key}</Label>
                <div className="relative">
                  <Input
                    id={`airbnb-${slot.key}-url`}
                    type="url"
                    inputMode="url"
                    placeholder="https://www.airbnb.com/rooms/12345678"
                    value={slot.url}
                    disabled={importing}
                    aria-invalid={slot.url.length > 0 && !valid}
                    onChange={(event) => {
                      updateSlot(index as 0 | 1, {
                        url: event.target.value,
                        status: "idle",
                        listing: undefined,
                        name: "",
                        amenities: [],
                        error: undefined,
                        source: undefined,
                        latitude: undefined,
                        longitude: undefined,
                        locationLabel: undefined,
                        bookingRequirements: [],
                        houseRules: [],
                        sampleAirport: undefined,
                        sampleNeighborhood: undefined,
                        maxGuests: undefined,
                        bedrooms: undefined,
                        beds: undefined,
                        bathrooms: undefined,
                      });
                      setFormError(null);
                    }}
                    className={cn("pr-9", valid && "border-go")}
                  />
                  {valid && <Check className="pointer-events-none absolute inset-y-0 right-2 my-auto size-4 text-go" />}
                </div>
                {slot.url.length > 0 && !valid && (
                  <p className="text-xs text-destructive">Use an Airbnb room link or official abnb.me short link.</p>
                )}
              </div>
            );
          })}
        </div>

        {formError && (
          <p className="mt-4 flex items-center gap-2 text-sm text-destructive" role="alert">
            <TriangleAlert className="size-4" /> {formError}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button type="button" size="lg" onClick={() => void importBoth()} disabled={importing}>
            {importing ? <Loader2 className="size-4 animate-spin" /> : null}
            {importing ? "Importing listings" : hasImportState ? "Import both again" : "Import both listings"}
          </Button>
          <Button type="button" size="lg" variant="outline" onClick={loadSampleData} disabled={importing}>
            Load sample data
          </Button>
          <span className="text-xs text-muted-foreground">
            Sample data is local and uses no Firecrawl credits.
          </span>
        </div>
      </section>

      {hasImportState && (
        <section aria-labelledby="review-heading">
          <div className="mb-4 border-b-2 border-foreground pb-2">
            <p className="eyebrow">Step 02</p>
            <h2 id="review-heading" className="mt-1 text-xl font-bold uppercase tracking-wide">
              Review extracted amenities
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {slots.map((slot, index) => (
              <AmenityReviewCard
                key={slot.key}
                slot={slot}
                onChange={(patch) => updateSlot(index as 0 | 1, patch)}
                onConfirm={() => updateSlot(index as 0 | 1, { status: "confirmed", name: slot.name.trim() })}
                onRetry={() => void importSlot(index as 0 | 1, slot.url)}
                onManual={() =>
                  updateSlot(index as 0 | 1, {
                    status: "review",
                    listing: undefined,
                    name: `Airbnb ${slot.key}`,
                    amenities: [],
                    source: "manual",
                  })
                }
              />
            ))}
          </div>
        </section>
      )}

      {hasImportState && (
        <section className="flex flex-col gap-3 border-t-2 border-foreground pt-6">
          <Button type="button" size="lg" disabled={!canCompare} onClick={() => setShowResults(true)}>
            Compare reviewed amenities
          </Button>
          {!canCompare && (
            <p className="text-center text-sm text-muted-foreground" aria-live="polite">
              Review and confirm both amenity lists to continue.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
