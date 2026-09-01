import assert from "node:assert/strict";
import test from "node:test";

import { calculateNights, calculateTripCost } from "../src/lib/trip-cost.ts";
import type { StayListing } from "../src/lib/types.ts";

const stay: StayListing = {
  id: "one",
  name: "One",
  url: "https://example.com",
  platform: "other",
  pricePerNight: "200",
  cleaningFee: "80",
  taxesAndFees: "120",
  parkingPerNight: "15",
};

test("calculates nights using calendar dates", () => {
  assert.equal(calculateNights("2026-09-01", "2026-09-05"), 4);
  assert.equal(calculateNights(null, null), 1);
  assert.equal(calculateNights("2026-09-05", "2026-09-01"), 1);
});

test("calculates total and per-person trip cost", () => {
  assert.deepEqual(calculateTripCost(stay, 4, 2), {
    nightlySubtotal: 800,
    cleaningFee: 80,
    taxesAndFees: 120,
    parkingSubtotal: 60,
    total: 1060,
    perPerson: 530,
    completeness: "complete",
  });
});
