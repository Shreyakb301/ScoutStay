# ScoutStay

ScoutStay helps travelers choose between short-term stays using two complementary workflows:

- **Decision briefing (`/brief`)** — describe the trip, compare two to five stays, and receive an explainable ranking grounded in listing details, real-world location signals, itinerary travel times, and total trip cost.
- **Airbnb amenity comparison (`/compare`)** — import two public Airbnb listings, review the extracted data, and compare shared and unique amenities without forcing a winner.

## Highlights

- Guided trip intake with traveler-specific scoring weights
- Airbnb import through Firecrawl with editable, confidence-labelled fields
- Manual comparison for Airbnb, Vrbo, Booking.com, direct hotels, and other stays
- OpenStreetMap geocoding, nearby-place intelligence, transit counts, and maps
- Airport access and optional Google driving routes
- Itinerary travel-time matrix for driving, transit, walking, and cycling
- Total reservation and per-person cost, including cleaning, taxes, and parking
- Evidence-based matching for must-haves, deal-breakers, and listing claims
- Grounded AI briefing with a deterministic fallback when OpenAI is unavailable
- Client-side saved comparisons, compressed share links, and Markdown exports
- Confidence gating that declines to recommend when listing data is too thin

## Local development

Requirements: Node.js 20.9 or newer.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). All external API keys are optional; missing integrations degrade to manual entry, route estimates, or deterministic text.

## Configuration

| Variable | Purpose |
| --- | --- |
| `FIRECRAWL_API_KEY` | Server-side Airbnb listing import |
| `GOOGLE_MAPS_API_KEY` | Google Routes driving duration and distance |
| `OPENAI_API_KEY` | Grounded AI decision brief |

Never expose these variables with a `NEXT_PUBLIC_` prefix.

## Commands

```bash
npm test       # Node unit tests
npm run lint   # ESLint and Next.js rules
npm run build  # Production build using Next's Webpack builder
npm start      # Serve the production build
```

## Data and confidence

ScoutStay distinguishes imported, manually entered, real-world, and estimated signals. Driving routes use Google when configured and otherwise fall back to a labelled geographic estimate. Transit, walking, and cycling durations are estimates based on straight-line distance and typical speeds; they are not live schedules. Recommendations are gated when important listing fields are missing.

Saved comparisons stay in the browser's local storage. Share links contain compressed comparison state in the URL. No database is required.

## External services

- [Firecrawl](https://www.firecrawl.dev/) for best-effort Airbnb extraction
- [OpenStreetMap](https://www.openstreetmap.org/), Nominatim, and Overpass for maps and local context
- [Google Routes API](https://developers.google.com/maps/documentation/routes) for optional driving routes
- [OpenAI API](https://platform.openai.com/docs/) for the optional briefing narrative

Public OpenStreetMap services are appropriate for development and light use. A production deployment with meaningful traffic should use a commercial provider or self-hosted Nominatim/Overpass instances and replace the in-memory request limiter with shared storage.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/app` | Next.js pages and server API routes |
| `src/components` | Intake, import, comparison, map, and briefing interfaces |
| `src/hooks` | Client-side location and briefing data orchestration |
| `src/lib` | Scraping, scoring, RAG, routing, cost, sharing, and export logic |
| `tests` | Dependency-free Node unit tests |

## Security

Costly API routes are rate-limited, AI payloads are bounded, integration keys remain server-side, and standard response-hardening headers are applied globally. Run `npm audit --omit=dev` as part of dependency maintenance.
