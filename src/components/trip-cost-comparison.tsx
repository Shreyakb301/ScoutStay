import { CircleDollarSign, TriangleAlert } from "lucide-react";

import { Panel } from "@/components/briefing";
import { calculateNights, calculateTripCost } from "@/lib/trip-cost";
import type { TripContext } from "@/lib/trip-intake";
import type { StayListing } from "@/lib/types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function TripCostComparison({
  stays,
  tripContext,
  travelers,
}: {
  stays: StayListing[];
  tripContext?: TripContext;
  travelers: number;
}) {
  const nights = calculateNights(tripContext?.checkIn, tripContext?.checkOut);
  const entries = stays
    .map((stay) => ({
      stay,
      cost: calculateTripCost(stay, nights, travelers),
    }))
    .sort((a, b) => a.cost.total - b.cost.total);
  const hasAnyPrice = entries.some((entry) => entry.cost.total > 0);

  return (
    <Panel
      title="Total trip cost"
      aside={`${nights} night${nights === 1 ? "" : "s"} · ${travelers} traveler${travelers === 1 ? "" : "s"}`}
      bodyClassName="flex flex-col gap-4"
    >
      {!tripContext?.checkIn || !tripContext?.checkOut ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <TriangleAlert className="size-4 text-caution" /> No trip dates were
          provided, so totals use one night.
        </p>
      ) : null}
      {!hasAnyPrice ? (
        <p className="text-sm text-muted-foreground">
          Add nightly prices and fees to compare the full reservation cost.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-foreground text-left">
                <th className="py-2 pr-4">Stay</th>
                <th className="px-3 py-2 text-right">Nightly</th>
                <th className="px-3 py-2 text-right">Cleaning</th>
                <th className="px-3 py-2 text-right">Taxes/fees</th>
                <th className="px-3 py-2 text-right">Parking</th>
                <th className="px-3 py-2 text-right">Trip total</th>
                <th className="py-2 pl-3 text-right">Per person</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(({ stay, cost }, index) => (
                <tr key={stay.id} className="border-b border-border">
                  <td className="py-3 pr-4 font-medium">
                    <span className="flex items-center gap-2">
                      {index === 0 && cost.total > 0 ? (
                        <CircleDollarSign className="size-4 text-go" />
                      ) : null}
                      {stay.name || "Untitled stay"}
                    </span>
                    {cost.completeness === "partial" ? (
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        Partial estimate
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {usd.format(cost.nightlySubtotal)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {usd.format(cost.cleaningFee)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {usd.format(cost.taxesAndFees)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {usd.format(cost.parkingSubtotal)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums">
                    {usd.format(cost.total)}
                  </td>
                  <td className="py-3 pl-3 text-right tabular-nums">
                    {usd.format(cost.perPerson)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
