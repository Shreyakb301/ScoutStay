"use client";

import { Check, Trash2 } from "lucide-react";

import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FACILITIES } from "@/lib/facilities";
import { PLATFORM_OPTIONS } from "@/lib/mock-data";
import type { FacilityId, Platform, StayListing } from "@/lib/types";
import { cn } from "@/lib/utils";

type UrlStatus = "empty" | "valid" | "invalid";

/**
 * Validates that a string is a well-formed Airbnb listing link. A true
 * "does this page exist" check isn't possible from the browser — Airbnb
 * blocks cross-origin requests — so we validate the URL shape instead.
 */
function listingUrlStatus(value: string, platform: Platform): UrlStatus {
  const trimmed = value.trim();
  if (!trimmed) return "empty";
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "invalid";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "invalid";
  const host = url.hostname.toLowerCase();
  if (platform !== "airbnb") return "valid";
  if (host === "abnb.me") return "valid";
  const isAirbnb = /(^|\.)airbnb\.[a-z.]+$/.test(host);
  if (!isAirbnb) return "invalid";
  if (!/\/rooms\/\d+/.test(url.pathname)) return "invalid";
  return "valid";
}

/** Derive a readable stay name from a valid Airbnb listing link. */
function deriveNameFromUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    const match = url.pathname.match(/\/rooms\/(\d+)/);
    if (match) return `Airbnb listing ${match[1]}`;
  } catch {
    // ignore
  }
  return "";
}

interface StayListingFieldsProps {
  index: number;
  stay: StayListing;
  onChange: (id: string, patch: Partial<Omit<StayListing, "id">>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export function StayListingFields({
  index,
  stay,
  onChange,
  onRemove,
  canRemove,
}: StayListingFieldsProps) {
  const urlStatus = listingUrlStatus(stay.url, stay.platform);

  const handleUrlChange = (value: string) => {
    const patch: Partial<Omit<StayListing, "id">> = {
      url: value,
    };
    const name = stay.platform === "airbnb" ? deriveNameFromUrl(value) : "";
    if (name) patch.name = name;
    onChange(stay.id, patch);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between border-b border-border pb-3">
        <CardTitle className="data text-sm uppercase tracking-[0.12em]">
          Stay {String(index + 1).padStart(2, "0")}
        </CardTitle>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove stay ${index + 1}`}
            onClick={() => onRemove(stay.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`stay-${stay.id}-platform`}>Platform</Label>
          <Select
            value={stay.platform}
            onValueChange={(value) => onChange(stay.id, { platform: value as Platform })}
          >
            <SelectTrigger id={`stay-${stay.id}-platform`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`stay-${stay.id}-name`}>Stay name</Label>
          <Input
            id={`stay-${stay.id}-name`}
            value={stay.name}
            placeholder="Downtown loft"
            required
            onChange={(event) => onChange(stay.id, { name: event.target.value })}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor={`stay-${stay.id}-url`}>
            Source listing link <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <div className="relative">
            <Input
              id={`stay-${stay.id}-url`}
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={stay.url}
              onChange={(event) => handleUrlChange(event.target.value)}
              aria-invalid={urlStatus === "invalid"}
              className={cn(
                "pr-9",
                urlStatus === "valid" &&
                  "border-go focus-visible:border-go focus-visible:ring-go/30"
              )}
            />
            {urlStatus === "valid" && (
              <Check className="pointer-events-none absolute inset-y-0 right-2 my-auto size-4 text-go" />
            )}
          </div>
          {urlStatus === "invalid" && (
            <p className="text-xs text-destructive">
              Enter a complete http(s) listing URL
              {stay.platform === "airbnb" ? " such as airbnb.com/rooms/12345678" : ""}.
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor={`stay-${stay.id}-address`}>Address or area</Label>
          <AddressAutocomplete
            id={`stay-${stay.id}-address`}
            value={stay.address ?? ""}
            hasSelection={typeof stay.latitude === "number" && typeof stay.longitude === "number"}
            selectionCaption={[stay.city, stay.region].filter(Boolean).join(", ")}
            placeholder="Search for an address or neighborhood"
            onInputChange={(address) =>
              onChange(stay.id, {
                address,
                latitude: undefined,
                longitude: undefined,
                placeName: undefined,
                city: undefined,
                region: undefined,
              })
            }
            onSelect={(suggestion) =>
              onChange(stay.id, {
                address: suggestion.formattedAddress,
                latitude: suggestion.latitude,
                longitude: suggestion.longitude,
                placeName: suggestion.placeName,
                city: suggestion.city,
                region: suggestion.region,
              })
            }
            onClear={() =>
              onChange(stay.id, {
                address: "",
                latitude: undefined,
                longitude: undefined,
                placeName: undefined,
                city: undefined,
                region: undefined,
              })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`stay-${stay.id}-price`}>
            Price per night (USD){" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id={`stay-${stay.id}-price`}
            type="number"
            min="0"
            step="1"
            placeholder="150"
            value={stay.pricePerNight}
            onChange={(event) =>
              onChange(stay.id, { pricePerNight: event.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`stay-${stay.id}-cleaning`}>Cleaning fee (USD)</Label>
          <Input
            id={`stay-${stay.id}-cleaning`}
            type="number"
            min="0"
            step="0.01"
            placeholder="75"
            value={stay.cleaningFee ?? ""}
            onChange={(event) =>
              onChange(stay.id, { cleaningFee: event.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`stay-${stay.id}-taxes`}>Taxes and other fees (USD)</Label>
          <Input
            id={`stay-${stay.id}-taxes`}
            type="number"
            min="0"
            step="0.01"
            placeholder="120"
            value={stay.taxesAndFees ?? ""}
            onChange={(event) =>
              onChange(stay.id, { taxesAndFees: event.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`stay-${stay.id}-parking`}>Parking per night (USD)</Label>
          <Input
            id={`stay-${stay.id}-parking`}
            type="number"
            min="0"
            step="0.01"
            placeholder="25"
            value={stay.parkingPerNight ?? ""}
            onChange={(event) =>
              onChange(stay.id, { parkingPerNight: event.target.value })
            }
          />
        </div>
        {[
          ["bedrooms", "Bedrooms", "1"],
          ["beds", "Beds", "1"],
          ["bathrooms", "Bathrooms", "1"],
          ["maxGuests", "Max guests", "2"],
          ["rating", "Rating", "4.8"],
          ["reviewCount", "Review count", "100"],
        ].map(([field, label, placeholder]) => (
          <div key={field} className="grid gap-2">
            <Label htmlFor={`stay-${stay.id}-${field}`}>{label}</Label>
            <Input
              id={`stay-${stay.id}-${field}`}
              type="number"
              min="0"
              max={field === "rating" ? "5" : undefined}
              step={field === "rating" || field === "bathrooms" ? "0.1" : "1"}
              placeholder={placeholder}
              value={(stay[field as keyof StayListing] as number | undefined) ?? ""}
              onChange={(event) =>
                onChange(stay.id, {
                  [field]: event.target.value === "" ? undefined : Number(event.target.value),
                })
              }
            />
          </div>
        ))}

        <fieldset className="grid gap-2 sm:col-span-2">
          <legend className="text-sm font-medium">Facilities and amenities</legend>
          <div className="flex flex-wrap gap-2">
            {FACILITIES.map((facility) => {
              const active = stay.facilities?.includes(facility.id) ?? false;
              return (
                <button
                  key={facility.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    const current = new Set(stay.facilities ?? []);
                    if (active) current.delete(facility.id);
                    else current.add(facility.id);
                    onChange(stay.id, { facilities: [...current] as FacilityId[] });
                  }}
                  className={cn(
                    "border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "border-go bg-go/10 text-foreground" : "border-border text-muted-foreground"
                  )}
                >
                  {active ? "✓ " : ""}{facility.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor={`stay-${stay.id}-notes`}>Notes and review evidence</Label>
          <Textarea
            id={`stay-${stay.id}-notes`}
            value={stay.notes ?? ""}
            placeholder="Paste relevant listing details or review notes, including noise, access, or neighborhood context."
            onChange={(event) => onChange(stay.id, { notes: event.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
