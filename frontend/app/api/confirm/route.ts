import { NextResponse } from "next/server";
import { getStore, type IncidentRecord } from "../_lib/store";

const store = getStore();

export async function POST(req: Request) {
  // Accept either an `id` or an `address` so users can confirm incidents created
  // manually (by address) as well as those created by the upload flow.
  const payload = await req.json();
  const id = payload?.id as string | undefined;
  const address = (payload?.address || payload?.location || payload?.addr) as string | undefined;
  const manualLocation = payload?.location as IncidentRecord["location"] | undefined;
  const manualEmergencyType = payload?.emergencyType as string | undefined;
  const manualEmergencyTags = Array.isArray(payload?.emergencyTags)
    ? payload.emergencyTags.filter((tag: unknown) => typeof tag === "string")
    : undefined;
  const manualTranscript = payload?.transcript as string | undefined;
  const manualNotes = payload?.notes as string | undefined;
  const manualCreatedAt = payload?.createdAt as string | undefined;

  if (!id && !address) {
    return NextResponse.json({ error: "Missing incident id or address" }, { status: 400 });
  }

  let existing = id ? store.get(id) : undefined;
  let keyToUpdate: string | undefined = id;

  // If no id was provided but an address was, try to find a matching incident by
  // comparing the stored location address or notes. This helps when a record was
  // created manually and only the address is known.
  if (!existing && address) {
    for (const [key, rec] of store.entries()) {
      const locAddr = rec.location?.address;
      const notes = rec.notes;
      if (
        (typeof locAddr === 'string' && locAddr.toLowerCase().includes(address.toLowerCase())) ||
        (typeof notes === 'string' && notes.toLowerCase().includes(address.toLowerCase()))
      ) {
        existing = rec;
        keyToUpdate = key;
        break;
      }
    }
  }

  if (!existing && address) {
    const manualId = id || `manual-${Date.now()}`;
    const createdAt = manualCreatedAt && !Number.isNaN(Date.parse(manualCreatedAt)) ? manualCreatedAt : new Date().toISOString();
    existing = {
      id: manualId,
      status: "needs_confirmation",
      createdAt,
      emergencyType: manualEmergencyType || "manual",
      emergencyTags: manualEmergencyTags,
      transcript: manualTranscript || manualNotes || `Manual confirmation for ${address}`,
      location: manualLocation || (address ? { lat: 0, lng: 0, address } : null),
      notes: manualNotes || undefined,
    };
    keyToUpdate = manualId;
    store.set(manualId, existing);
  }

  if (!existing) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  const merged: IncidentRecord = {
    ...existing,
    emergencyType: manualEmergencyType || existing.emergencyType,
    emergencyTags: manualEmergencyTags?.length ? manualEmergencyTags : existing.emergencyTags,
    transcript: manualTranscript || existing.transcript,
    notes: manualNotes || existing.notes,
    location: manualLocation || existing.location,
  };

  const updated: IncidentRecord = {
    ...merged,
    status: "done",
    confirmedAt: new Date().toISOString(),
  };

  // Use the discovered key (either the provided id or the matched key from lookup)
  store.set(keyToUpdate as string, updated);

  return NextResponse.json(updated);
}

// Debug helper: list current incidents in the in-memory store.
// Only expose in non-production to avoid leaking data in production.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not available' }, { status: 404 });
  }

  const items: Array<Record<string, any>> = [];
  for (const [key, rec] of store.entries()) {
    items.push({ key, id: rec.id, status: rec.status, address: rec.location?.address ?? null, notes: rec.notes ?? null, createdAt: rec.createdAt });
  }

  return NextResponse.json({ count: items.length, items });
}
