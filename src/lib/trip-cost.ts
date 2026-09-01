import type { StayListing } from "@/lib/types";

export interface TripCostBreakdown {
  nightlySubtotal: number;
  cleaningFee: number;
  taxesAndFees: number;
  parkingSubtotal: number;
  total: number;
  perPerson: number;
  completeness: "complete" | "partial";
}

function amount(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function calculateNights(
  checkIn?: string | null,
  checkOut?: string | null
): number {
  if (!checkIn || !checkOut) return 1;
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return Math.round((end - start) / 86_400_000);
}

export function calculateTripCost(
  stay: StayListing,
  nights: number,
  travelers: number
): TripCostBreakdown {
  const safeNights = Math.max(1, Math.round(nights));
  const safeTravelers = Math.max(1, Math.round(travelers));
  const nightlySubtotal = amount(stay.pricePerNight) * safeNights;
  const cleaningFee = amount(stay.cleaningFee);
  const taxesAndFees = amount(stay.taxesAndFees);
  const parkingSubtotal = amount(stay.parkingPerNight) * safeNights;
  const total = nightlySubtotal + cleaningFee + taxesAndFees + parkingSubtotal;

  return {
    nightlySubtotal,
    cleaningFee,
    taxesAndFees,
    parkingSubtotal,
    total,
    perPerson: total / safeTravelers,
    completeness:
      stay.pricePerNight && stay.cleaningFee && stay.taxesAndFees
        ? "complete"
        : "partial",
  };
}
