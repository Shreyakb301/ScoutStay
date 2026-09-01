import assert from "node:assert/strict";
import test from "node:test";

import { checkRateLimit } from "../src/lib/rate-limit.ts";

test("limits requests by namespace and client address", () => {
  const request = new Request("https://example.test/api", {
    headers: { "x-forwarded-for": "203.0.113.10" },
  });
  const policy = { limit: 2, windowMs: 1000 };
  assert.equal(checkRateLimit(request, "test-a", policy, 1000).allowed, true);
  assert.equal(checkRateLimit(request, "test-a", policy, 1001).allowed, true);
  const blocked = checkRateLimit(request, "test-a", policy, 1002);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(checkRateLimit(request, "test-a", policy, 2001).allowed, true);
});

test("keeps route namespaces and clients isolated", () => {
  const first = new Request("https://example.test/api", {
    headers: { "x-real-ip": "203.0.113.20" },
  });
  const second = new Request("https://example.test/api", {
    headers: { "x-real-ip": "203.0.113.21" },
  });
  const policy = { limit: 1, windowMs: 1000 };
  assert.equal(checkRateLimit(first, "test-b", policy, 5000).allowed, true);
  assert.equal(checkRateLimit(first, "test-b", policy, 5001).allowed, false);
  assert.equal(checkRateLimit(second, "test-b", policy, 5001).allowed, true);
  assert.equal(checkRateLimit(first, "test-c", policy, 5001).allowed, true);
});
