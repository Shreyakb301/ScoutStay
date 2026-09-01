/** Pure helpers for reviewing and comparing raw Airbnb amenity labels. */

const AMENITY_ALIASES: Record<string, string> = {
  wifi: "Wi-Fi",
  wirelessinternet: "Wi-Fi",
  airconditioning: "Air conditioning",
  ac: "Air conditioning",
  kitchen: "Kitchen",
  washer: "Washer",
  washingmachine: "Washer",
  dryer: "Dryer",
  freeparking: "Free parking",
  freeparkingonpremises: "Free parking",
  dedicatedworkspace: "Dedicated workspace",
  workspace: "Dedicated workspace",
  smokealarm: "Smoke alarm",
  smokedetector: "Smoke alarm",
  carbonmonoxidealarm: "Carbon monoxide alarm",
  carbonmonoxidedetector: "Carbon monoxide alarm",
  firstaidkit: "First aid kit",
  fireextinguisher: "Fire extinguisher",
  hottub: "Hot tub",
  selfcheckin: "Self check-in",
};

/** Stable comparison key: case- and harmless-punctuation-insensitive. */
export function amenityKey(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

/** Clean a provider/user label and apply only explicit, safe aliases. */
export function normalizeAmenityLabel(value: string): string {
  const cleaned = value
    .normalize("NFKC")
    .replace(/^[\s\u2022\-*]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  // Airbnb often qualifies Wi-Fi with a measured speed. The speed is useful
  // copy, but it should not make Wi-Fi look like a different amenity.
  if (/\b(?:wi[\s-]?fi|wireless internet)\b/i.test(cleaned)) return "Wi-Fi";
  return AMENITY_ALIASES[amenityKey(cleaned)] ?? cleaned;
}

/** Dedupe without losing the first useful human-readable label. */
export function normalizeAmenityList(values: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const value of values) {
    const label = normalizeAmenityLabel(value);
    const key = amenityKey(label);
    if (label && key && !byKey.has(key)) byKey.set(key, label);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

export interface AmenityDifference {
  label: string;
  inA: boolean;
  inB: boolean;
}

export interface AmenityComparison {
  common: string[];
  onlyA: string[];
  onlyB: string[];
  differences: AmenityDifference[];
}

export function compareAmenityLists(
  amenitiesA: string[],
  amenitiesB: string[]
): AmenityComparison {
  const a = normalizeAmenityList(amenitiesA);
  const b = normalizeAmenityList(amenitiesB);
  const aByKey = new Map(a.map((label) => [amenityKey(label), label]));
  const bByKey = new Map(b.map((label) => [amenityKey(label), label]));

  const common = a
    .filter((label) => bByKey.has(amenityKey(label)))
    .map((label) => AMENITY_ALIASES[amenityKey(label)] ?? label)
    .sort((left, right) => left.localeCompare(right));
  const onlyA = a.filter((label) => !bByKey.has(amenityKey(label)));
  const onlyB = b.filter((label) => !aByKey.has(amenityKey(label)));

  return {
    common,
    onlyA,
    onlyB,
    differences: [
      ...onlyA.map((label) => ({ label, inA: true, inB: false })),
      ...onlyB.map((label) => ({ label, inA: false, inB: true })),
    ].sort((left, right) => left.label.localeCompare(right.label)),
  };
}
