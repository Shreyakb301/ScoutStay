import assert from "node:assert/strict";
import test from "node:test";

import {
  compareAmenityLists,
  normalizeAmenityLabel,
  normalizeAmenityList,
} from "../src/lib/amenity-comparison.ts";

test("normalizes safe aliases without rewriting unknown provider labels", () => {
  assert.equal(normalizeAmenityLabel("  Wifi  "), "Wi-Fi");
  assert.equal(normalizeAmenityLabel("Fast wifi – 464 Mbps"), "Wi-Fi");
  assert.equal(normalizeAmenityLabel("• self check in"), "Self check-in");
  assert.equal(normalizeAmenityLabel("Lake view"), "Lake view");
});

test("deduplicates capitalization, punctuation, and aliases", () => {
  assert.deepEqual(
    normalizeAmenityList(["Wifi", "WI-FI", "wireless internet", "Pool", " pool "]),
    ["Pool", "Wi-Fi"]
  );
});

test("separates shared and listing-specific amenities", () => {
  const result = compareAmenityLists(
    ["Wifi", "Kitchen", "Pool"],
    ["Wi-Fi", "Kitchen", "Free parking"]
  );

  assert.deepEqual(result.common, ["Kitchen", "Wi-Fi"]);
  assert.deepEqual(result.onlyA, ["Pool"]);
  assert.deepEqual(result.onlyB, ["Free parking"]);
  assert.deepEqual(result.differences, [
    { label: "Free parking", inA: false, inB: true },
    { label: "Pool", inA: true, inB: false },
  ]);
});

test("handles empty and duplicate lists deterministically", () => {
  assert.deepEqual(compareAmenityLists([], []), {
    common: [],
    onlyA: [],
    onlyB: [],
    differences: [],
  });
});
