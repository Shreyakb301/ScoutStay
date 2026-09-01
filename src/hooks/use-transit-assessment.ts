"use client";

import { useEffect, useState } from "react";

import type { LngLat } from "@/lib/geocode";

export interface TransitAssessment {
  count: number;
  names: string[];
  radiusMeters: number;
}

export interface NeighborhoodHighlightGroup {
  count: number;
  names: string[];
}

export interface NeighborhoodHighlights {
  radiusMeters: number;
  food: NeighborhoodHighlightGroup;
  grocery: NeighborhoodHighlightGroup;
  parksAndSights: NeighborhoodHighlightGroup;
  nightlife: NeighborhoodHighlightGroup;
}

interface TransitAssessmentState {
  assessments: Record<string, TransitAssessment>;
  highlights: Record<string, NeighborhoodHighlights>;
  errors: Record<string, string>;
  loading: boolean;
}

export function useTransitAssessment(
  locations: Record<string, LngLat>
): TransitAssessmentState {
  const [state, setState] = useState<TransitAssessmentState>({
    assessments: {},
    highlights: {},
    errors: {},
    loading: false,
  });

  useEffect(() => {
    const entries = Object.entries(locations);
    if (entries.length === 0) {
      setState({ assessments: {}, highlights: {}, errors: {}, loading: false });
      return;
    }

    let cancelled = false;
    setState({ assessments: {}, highlights: {}, errors: {}, loading: true });

    const load = async () => {
      try {
        const response = await fetch("/api/nearby-transit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locations: entries.map(([key, coords]) => ({
              key,
              latitude: coords.lat,
              longitude: coords.lng,
            })),
          }),
        });
        const result = (await response.json()) as {
          ok?: boolean;
          assessments?: Record<string, TransitAssessment>;
          highlights?: Record<string, NeighborhoodHighlights>;
          errors?: Record<string, string>;
        };
        if (!cancelled) {
          setState({
            assessments: result.assessments ?? {},
            highlights: result.highlights ?? {},
            errors: result.errors ?? {},
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            assessments: {},
            highlights: {},
            errors: Object.fromEntries(
              entries.map(([key]) => [key, "Transit data unavailable"])
            ),
            loading: false,
          });
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [locations]);

  return state;
}
