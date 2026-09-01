import assert from "node:assert/strict";
import test from "node:test";

import { buildTransportPlaceQuery } from "../src/lib/geocode.ts";

test("adds the selected transport category to arrival searches", () => {
  assert.equal(buildTransportPlaceQuery("Chicago", "airport"), "Chicago airport");
  assert.equal(
    buildTransportPlaceQuery("Union Square", "train"),
    "Union Square train station"
  );
  assert.equal(
    buildTransportPlaceQuery("  Austin  ", "bus"),
    "Austin bus station"
  );
});

test("keeps generic place searches unchanged", () => {
  assert.equal(buildTransportPlaceQuery("  Millennium Park  "), "Millennium Park");
  assert.equal(buildTransportPlaceQuery("", "airport"), "");
});
