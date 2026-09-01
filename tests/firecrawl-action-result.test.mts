import assert from "node:assert/strict";
import test from "node:test";

import { extractFirecrawlActionListingData } from "../src/lib/firecrawl-action-result.ts";

test("reads amenities and approximate location from Firecrawl action returns", () => {
  const result = extractFirecrawlActionListingData({
    actions: {
      javascriptReturns: [
        {
          value: { clicked: true, text: "Show all 44 amenities" },
        },
        {
          value: {
            amenities: ["Wi-Fi", "Pool"],
            expectedCount: 44,
            latitude: 36.6392,
            longitude: -93.3053,
            locationLabel: "Branson",
            houseRules: ["No smoking", "No parties or events"],
            cancellationInfo: "Free cancellation before August 1",
            maxGuests: 6,
            bedrooms: 2,
            beds: 3,
            bathrooms: 2,
          },
        },
      ],
    },
  });

  assert.deepEqual(result, {
    amenities: ["Wi-Fi", "Pool"],
    expectedCount: 44,
    latitude: 36.6392,
    longitude: -93.3053,
    locationLabel: "Branson",
    houseRules: ["No smoking", "No parties or events"],
    cancellationInfo: "Free cancellation before August 1",
    maxGuests: 6,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
  });
});

test("handles missing or stringified action data safely", () => {
  assert.deepEqual(
    extractFirecrawlActionListingData({
      actions: {
        javascriptReturns: [
          { value: "not-json" },
          {
            value: JSON.stringify({
              amenities: ["Kitchen", ""],
              latitude: 36.62587,
              longitude: -93.21959,
            }),
          },
        ],
      },
    }),
    {
      amenities: ["Kitchen"],
      expectedCount: null,
      latitude: 36.62587,
      longitude: -93.21959,
      locationLabel: null,
      houseRules: [],
      cancellationInfo: null,
      maxGuests: null,
      bedrooms: null,
      beds: null,
      bathrooms: null,
    }
  );
});
