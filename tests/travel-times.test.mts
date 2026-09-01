import assert from "node:assert/strict";
import test from "node:test";

import { estimateTravelTime, straightLineKm } from "../src/lib/travel-times.ts";

test("calculates a stable great-circle distance", () => {
  const distance = straightLineKm(
    { lat: 41.8781, lng: -87.6298 },
    { lat: 41.9742, lng: -87.9073 }
  );
  assert.ok(distance > 24 && distance < 26);
});

test("returns explicit estimates for every travel mode", () => {
  const origin = { lat: 41.8781, lng: -87.6298 };
  const destination = { lat: 41.9, lng: -87.65 };
  for (const mode of ["drive", "transit", "walk", "bike"] as const) {
    const estimate = estimateTravelTime(origin, destination, mode);
    assert.equal(estimate.source, "estimate");
    assert.ok(estimate.distanceKm > 0);
    assert.ok(estimate.durationMinutes > 0);
  }
});
