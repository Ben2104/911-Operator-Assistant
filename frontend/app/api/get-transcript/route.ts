import { NextResponse } from "next/server";
import { type IncidentRecord } from "../_lib/store";

const TRANSCRIPTS_ENDPOINT =
  process.env.TRANSCRIPTS_API_URL ?? "http://127.0.0.1:8000/get-transcript";

type BackendIncident = {
  id?: string;
  createdAt?: string;
  Address?: string;
  address?: string;
  Incident?: string;
  incident?: string;
  lat?: number | string;
  long?: number | string;
  lng?: number | string;
  longitude?: number | string;
  latitude?: number | string;
  Response_time?: number;
  Transcription?: string;
  transcript?: string;
};

const parseNumber = (value: string | number | undefined | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toIncidentRecord = (item: BackendIncident, idx: number): IncidentRecord => {
  const lat =
    parseNumber(item.lat) ??
    parseNumber(item.latitude) ??
    parseNumber(item.lng) ??
    parseNumber(item.longitude);
  const lng = parseNumber(item.long) ?? parseNumber(item.lng) ?? parseNumber(item.longitude);

  const location =
    lat !== null && lng !== null
      ? {
          lat,
          lng,
          address: item.Address || item.address,
        }
      : null;

  return {
    id: item.id || `remote-${idx}-${Date.now()}`,
    status: "needs_confirmation",
    createdAt: item.createdAt || new Date().toISOString(),
    transcript: item.Transcription || item.transcript || "No transcript available.",
    emergencyType: item.Incident || item.incident || "Unknown",
    confidence: undefined,
    location,
    notes: item.Address || item.address,
    emergencyTags: item.Incident ? [item.Incident.toLowerCase()] : undefined,
    callerPhone: undefined,
    flags: undefined,
  };
};

export async function GET() {
  try {
    const response = await fetch(TRANSCRIPTS_ENDPOINT, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Transcripts API request failed with ${response.status}`);
    }

    const payload = (await response.json()) as BackendIncident[] | null;
    
    console.log("Fetched transcripts payload:", payload);
    if (!payload || !Array.isArray(payload)) {
      return NextResponse.json([]);
    }

    const incidents = payload.map(toIncidentRecord).sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Failed to fetch transcripts", error);
    return NextResponse.json([], { status: 200 });
  }
}
