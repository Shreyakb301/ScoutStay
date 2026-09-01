# ScoutStay

**A smarter way to compare short-term stays before you book.**

ScoutStay is an Airbnb amenity comparison tool. Paste two public Airbnb links, review the amenities Firecrawl extracts, and see what both listings share and what only one listing provides.

## Demo

Run `npm run dev`, then open the `/compare` URL printed by Next.js. If port
`3000` is already occupied, Next.js automatically selects another port.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/app` | Next.js pages, layouts, and API routes |
| `src/components` | Two-listing import, amenity review, and comparison interface |
| `src/lib` | Firecrawl integration, listing normalization, and amenity matching |
| `public` | Static assets |

## Frontend

- Next.js App Router with React client components
- Tailwind CSS interface with reusable UI primitives
- Concurrent two-listing import with independent error recovery
- Responsive shared-and-different amenity results

## Special features

| Feature | What it does |
| --- | --- |
| Firecrawl import | Pulls two public Airbnb listings concurrently |
| Editable review | Lets users correct incomplete scraped amenity lists |
| Shared amenities | Groups amenities found in both reviewed listings |
| Differences table | Shows listing-specific amenities without forcing a winner |
| Manual recovery | Keeps successful data when the other listing cannot be scraped |

## How it works

1. Paste two Airbnb listing links.
2. ScoutStay imports both listings with Firecrawl and lets you correct the extracted amenities.
3. The results show shared amenities first, followed by a neutral table of differences.

## Tech stack

`Next.js` · `React` · `TypeScript` · `Tailwind CSS` · `Firecrawl`

## Listing scraper configuration

Set `FIRECRAWL_API_KEY` to use Firecrawl as the Airbnb listing scraper. When a
listing is blocked or incomplete, ScoutStay keeps the other successful import
and lets the user enter or correct amenities manually.
