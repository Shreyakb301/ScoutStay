import type { Platform, StayListing, TravelerType } from "@/lib/types";

export const TRAVELER_TYPES: TravelerType[] = [
  {
    id: "solo",
    label: "Solo traveler",
    description: "Exploring on your own terms",
    code: "SOLO",
    priorities: ["Safety", "Location", "Value"],
  },
  {
    id: "couple",
    label: "Couple",
    description: "A getaway for two",
    code: "DUO",
    priorities: ["Ambiance", "Privacy", "Nearby dining"],
  },
  {
    id: "family",
    label: "Family",
    description: "Traveling with kids in tow",
    code: "FAM",
    priorities: ["Space", "Kitchen", "Kid-friendly"],
  },
  {
    id: "friends",
    label: "Friend group",
    description: "A trip with the crew",
    code: "GRP",
    priorities: ["Beds & baths", "Common areas", "Nightlife access"],
  },
  {
    id: "business",
    label: "Business",
    description: "Work travel, minimal friction",
    code: "BIZ",
    priorities: ["Wi-Fi", "Workspace", "Transit access"],
  },
];

export const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "airbnb", label: "Airbnb" },
  { value: "vrbo", label: "Vrbo" },
  { value: "booking", label: "Booking.com" },
  { value: "hotel", label: "Hotel (direct)" },
  { value: "other", label: "Other" },
];

/** Sample stays used by the "Fill with sample data" action on the compare form. */
export const SAMPLE_STAYS: Omit<StayListing, "id">[] = [
  {
    name: "Sunny Loft near Old Town",
    url: "https://www.airbnb.com/rooms/12345678",
    platform: "airbnb",
    pricePerNight: "142",
    address: "Rua dos Fanqueiros 77, Lisbon, Portugal",
    latitude: 38.7107,
    longitude: -9.1368,
    placeName: "Rua dos Fanqueiros 77",
    city: "Lisbon",
    region: "Lisboa",
    notes:
      "Walkable central location, lots of cafes and restaurants nearby. Reviews mention some street noise on weekends from nearby bars.",
    listingDescription:
      "Bright central loft with a full kitchen, balcony, fast Wi-Fi, and self check-in. The apartment is close to restaurants, cafes, transit, and the riverfront.",
    reviewText:
      "Guests loved the walkable location, responsive host, clean kitchen, and easy check-in. A few reviews mention weekend street noise from nearby nightlife.",
    houseRulesText:
      "Self check-in after 3 PM. Quiet hours after 10 PM. No parties.",
    amenitiesText:
      "Fast Wi-Fi, kitchen, balcony, heating, smoke alarm, security cameras, and self check-in.",
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    maxGuests: 2,
    rating: 4.82,
    reviewCount: 118,
    facilities: [
      "wifi",
      "kitchen",
      "heating",
      "balcony-patio",
      "self-check-in",
      "smoke-alarm",
      "security-cameras",
    ],
  },
  {
    name: "Riverside Cabin Retreat",
    url: "https://www.vrbo.com/9876543",
    platform: "vrbo",
    pricePerNight: "189",
    address: "Estrada da Peninha, Sintra, Portugal",
    latitude: 38.7782,
    longitude: -9.4376,
    placeName: "Estrada da Peninha",
    city: "Sintra",
    region: "Lisboa",
    notes:
      "Quiet and secluded riverside spot with a full kitchen. Car required — about 20 minutes drive to town, no transit nearby.",
    listingDescription:
      "Private cabin outside Sintra with a full kitchen, parking, hot tub, laundry, and a quiet outdoor patio. Best for travelers with a car who want space and privacy.",
    reviewText:
      "Guests praise the peaceful setting, comfortable beds, and private outdoor area. Reviews consistently note that a rental car is necessary.",
    houseRulesText:
      "Check-in after 4 PM. Pets allowed with approval. No loud outdoor music after 9 PM.",
    amenitiesText:
      "Kitchen, washer and dryer, free parking, hot tub, pet-friendly policy, patio, first aid kit, fire extinguisher, and smoke alarm.",
    bedrooms: 2,
    beds: 3,
    bathrooms: 1.5,
    maxGuests: 5,
    rating: 4.74,
    reviewCount: 86,
    facilities: [
      "wifi",
      "kitchen",
      "free-parking",
      "heating",
      "washer-dryer",
      "pet-friendly",
      "balcony-patio",
      "hot-tub",
      "first-aid-kit",
      "fire-extinguisher",
      "smoke-alarm",
    ],
  },
  {
    name: "Hotel Meridian, King Room",
    url: "https://www.booking.com/hotel/meridian",
    platform: "booking",
    pricePerNight: "165",
    address: "Avenida da Liberdade 185, Lisbon, Portugal",
    latitude: 38.7205,
    longitude: -9.1465,
    placeName: "Avenida da Liberdade 185",
    city: "Lisbon",
    region: "Lisboa",
    notes:
      "Modern hotel with 24h front desk, gym, and fast wifi. Two blocks from the metro station, dining options in the lobby and nearby.",
    listingDescription:
      "Modern king room on Avenida da Liberdade with 24-hour front desk, daily housekeeping, fast Wi-Fi, gym access, pool, and strong transit access.",
    reviewText:
      "Guests highlight the professional front desk, quiet rooms, comfortable bed, and quick metro access. Business travelers mention reliable Wi-Fi and workspace.",
    houseRulesText:
      "Check-in after 2 PM. Front desk open 24 hours. No pets.",
    amenitiesText:
      "Fast Wi-Fi, air conditioning, workspace, gym, pool, heating, smoke alarm, carbon monoxide alarm, and fire extinguisher.",
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    maxGuests: 2,
    rating: 4.68,
    reviewCount: 342,
    facilities: [
      "wifi",
      "kitchen",
      "gym",
      "pool",
      "air-conditioning",
      "workspace",
      "self-check-in",
      "heating",
      "smoke-alarm",
      "carbon-monoxide-alarm",
      "fire-extinguisher",
    ],
  },
];
