"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Hand, MapPinOff, Maximize2, Minus, Plus } from "lucide-react";

import type { AirportIntelligence } from "@/lib/airport-intelligence";

export interface ComparisonMapPoint {
  key: "A" | "B";
  name: string;
  url: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
}

export interface VisitMapPoint {
  id: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

function pointIcon(key: "A" | "B"): L.DivIcon {
  const background = key === "A" ? "#dc7b21" : "#1f2937";
  const shift = key === "A" ? -18 : 18;
  return L.divIcon({
    className: "",
    html:
      `<div style="display:flex;align-items:center;justify-content:center;` +
      `width:32px;height:32px;background:${background};color:white;` +
      `font:700 14px/1 ui-monospace,SFMono-Regular,monospace;` +
      `border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);` +
      `transform:translateX(${shift}px)">${key}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [shift, -18],
  });
}

function airportIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html:
      `<div style="display:flex;align-items:center;justify-content:center;` +
      `width:46px;height:46px;border-radius:50%;background:#ffffff;` +
      `font-size:26px;line-height:1;border:4px solid #0f766e;` +
      `box-shadow:0 3px 12px rgba(0,0,0,.5)">✈️</div>`,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -25],
  });
}

function visitIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html:
      `<div style="display:flex;align-items:center;justify-content:center;` +
      `width:38px;height:38px;border-radius:50%;background:#ffffff;` +
      `font-size:21px;line-height:1;border:3px solid #7c3aed;` +
      `box-shadow:0 2px 8px rgba(0,0,0,.4)">📍</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -21],
  });
}

interface AirportMarkerData {
  airport: AirportIntelligence["airport"];
  listings: { key: string; distanceKm: number; driveMinutes: number; source: string }[];
}

function fitAllPoints(map: L.Map, positions: [number, number][]) {
  map.stop();
  map.invalidateSize({ pan: false });
  if (positions.length === 1) {
    map.setView(positions[0], 13);
  } else if (positions.length > 1) {
    map.fitBounds(L.latLngBounds(positions), {
      paddingTopLeft: [72, 72],
      paddingBottomRight: [72, 72],
      maxZoom: 12,
    });
  }
}

function FitPoints({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    const frame = requestAnimationFrame(() => fitAllPoints(map, positions));
    return () => cancelAnimationFrame(frame);
  }, [map, positions]);

  return null;
}

function MapControls({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const [moveEnabled, setMoveEnabled] = useState(true);

  useEffect(() => {
    if (!controlsRef.current) return;
    L.DomEvent.disableClickPropagation(controlsRef.current);
    L.DomEvent.disableScrollPropagation(controlsRef.current);
  }, []);

  useEffect(() => {
    if (moveEnabled) map.dragging.enable();
    else map.dragging.disable();
  }, [map, moveEnabled]);

  return (
    <div
      ref={controlsRef}
      className="absolute left-2 top-2 z-[1000] flex overflow-hidden border border-border bg-card shadow-md"
      aria-label="Map controls"
    >
      <button
        type="button"
        onClick={() => fitAllPoints(map, positions)}
        className="flex size-9 items-center justify-center border-r border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Show all map markers"
        title="Show all markers"
      >
        <Maximize2 className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="flex size-9 items-center justify-center border-r border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Plus className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="flex size-9 items-center justify-center border-r border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        aria-pressed={moveEnabled}
        onClick={() => setMoveEnabled((enabled) => !enabled)}
        className={`flex h-9 items-center gap-1.5 px-2.5 text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          moveEnabled ? "bg-foreground text-background hover:bg-foreground/85" : ""
        }`}
        title={moveEnabled ? "Map movement enabled" : "Enable map movement"}
      >
        <Hand className="size-3.5" /> Move
      </button>
    </div>
  );
}

export function ComparisonLocationMap({
  points,
  airports,
  airportLoading = false,
  airportErrors,
  visitPlaces = [],
}: {
  points: ComparisonMapPoint[];
  airports?: Record<string, AirportIntelligence | null>;
  airportLoading?: boolean;
  airportErrors?: Record<string, string>;
  visitPlaces?: VisitMapPoint[];
}) {
  const located = useMemo(
    () =>
      points.filter(
        (point): point is ComparisonMapPoint & {
          latitude: number;
          longitude: number;
        } =>
          typeof point.latitude === "number" &&
          Number.isFinite(point.latitude) &&
          typeof point.longitude === "number" &&
          Number.isFinite(point.longitude)
      ),
    [points]
  );
  const airportMarkers = useMemo<AirportMarkerData[]>(() => {
    const byId = new Map<string, AirportMarkerData>();
    for (const point of points) {
      const info = airports?.[point.key];
      if (!info) continue;
      const marker = byId.get(info.airport.id) ?? {
        airport: info.airport,
        listings: [],
      };
      marker.listings.push({
        key: point.key,
        distanceKm: info.distanceKm,
        driveMinutes: info.driveMinutes,
        source: info.source,
      });
      byId.set(info.airport.id, marker);
    }
    return [...byId.values()];
  }, [airports, points]);
  const positions = useMemo<[number, number][]>(
    () => [
      ...located.map((point): [number, number] => [point.latitude, point.longitude]),
      ...airportMarkers.map(
        (marker): [number, number] => [
          marker.airport.latitude,
          marker.airport.longitude,
        ]
      ),
      ...visitPlaces.map(
        (place): [number, number] => [place.latitude, place.longitude]
      ),
    ],
    [located, airportMarkers, visitPlaces]
  );

  if (located.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted/30 px-6 text-center">
        <MapPinOff className="size-6 text-muted-foreground" />
        <p className="font-semibold">Location unavailable</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Airbnb did not expose an approximate map location for these listings.
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-0 h-72 w-full overflow-hidden border border-border sm:h-80">
      <MapContainer
        center={positions[0]}
        zoom={11}
        zoomControl={false}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitPoints positions={positions} />
        <MapControls positions={positions} />
        {located.map((point) => (
          <Marker
            key={point.key}
            position={[point.latitude, point.longitude]}
            icon={pointIcon(point.key)}
            zIndexOffset={1000}
          >
            <Popup offset={[0, -8]}>
              <div className="min-w-44 text-sm">
                <p className="font-semibold">Airbnb {point.key}</p>
                <p className="mt-1">{point.name}</p>
                {point.locationLabel ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {point.locationLabel} · approximate area
                  </p>
                ) : null}
                <a
                  href={point.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs underline"
                >
                  Open Airbnb listing
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
        {airportMarkers.map((marker) => (
          <Marker
            key={marker.airport.id}
            position={[marker.airport.latitude, marker.airport.longitude]}
            icon={airportIcon()}
            zIndexOffset={600}
          >
            <Popup offset={[0, -8]}>
              <div className="min-w-48 text-sm">
                <p className="font-semibold">
                  {marker.airport.name}
                  {marker.airport.iata ? ` (${marker.airport.iata})` : ""}
                </p>
                {marker.listings.map((listing) => (
                  <p key={listing.key} className="mt-1 text-xs text-slate-600">
                    From Airbnb {listing.key}: {listing.distanceKm} km · ~{listing.driveMinutes} min
                    {listing.source === "estimate" ? " estimated" : " drive"}
                  </p>
                ))}
              </div>
            </Popup>
          </Marker>
        ))}
        {visitPlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={visitIcon()}
            zIndexOffset={400}
          >
            <Popup offset={[0, -8]}>
              <div className="min-w-44 text-sm">
                <p className="font-semibold">{place.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {place.formattedAddress}
                </p>
                <p className="mt-2 text-xs font-medium">Place to visit</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {airportLoading && airportMarkers.length === 0 && visitPlaces.length === 0 ? (
        <div className="pointer-events-none absolute bottom-5 left-2 z-[500] border border-border bg-card/95 px-2 py-1 text-[11px] font-medium shadow-sm">
          Finding nearest airport…
        </div>
      ) : airportMarkers.length > 0 || visitPlaces.length > 0 ? (
        <div className="pointer-events-none absolute bottom-5 left-2 z-[500] flex gap-2 border border-border bg-card/95 px-2 py-1 text-[11px] font-medium shadow-sm">
          {airportMarkers.length > 0 ? <span>✈️ Airport</span> : null}
          {visitPlaces.length > 0 ? <span>📍 Places to visit</span> : null}
        </div>
      ) : Object.keys(airportErrors ?? {}).length > 0 ? (
        <div className="pointer-events-none absolute bottom-5 left-2 z-[500] border border-border bg-card/95 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
          Airport data unavailable
        </div>
      ) : null}
    </div>
  );
}
