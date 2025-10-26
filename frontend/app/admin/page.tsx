"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { Mic, Square, Upload, MapPin, Loader2, CheckCircle2, TriangleAlert, Search, ChevronRight, Trash2 } from "lucide-react";

const MANUAL_TYPE_OPTIONS = [
  { value: "crime", label: "Crime" },
  { value: "medical", label: "Medical" },
  { value: "fire", label: "Fire" },
] as const;

type ManualIncidentType = (typeof MANUAL_TYPE_OPTIONS)[number]["value"];
const MANUAL_TYPE_LABEL: Record<ManualIncidentType, string> = {
  crime: "Crime",
  medical: "Medical",
  fire: "Fire",
};

const RESPONSE_SERVICE_OPTIONS = [
  { key: "firetrucks", label: "Firetrucks" },
  { key: "cops", label: "Cops" },
  { key: "ambulance", label: "Ambulance" },
] as const;

type ResponseService = (typeof RESPONSE_SERVICE_OPTIONS)[number]["key"];

type Incident = {
  id: string;
  createdAt: string; // ISO
  transcript?: string;
  notes?: string;
  emergencyType?: string;
  emergencyTags?: string[];
  confidence?: number; // 0..1
  location?: { lat: number; lng: number; address?: string } | null;
  callerPhone?: string;
  flags?: { brokenAccent?: boolean; intoxicated?: boolean; suspectedSwatting?: boolean };
  status: "processing" | "needs_confirmation" | "done";
};

function Button({ className = "", children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm border border-neutral-200 hover:shadow transition active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-neutral-200 shadow-sm bg-white ${className}`}>{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">{children}</div>;
}

export default function DashboardPage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const autoPannedRef = useRef(false); // we auto-pan only once
  const userMovedRef = useRef(false);  // stop auto-pan after any user move/click
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedUploadName, setSelectedUploadName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cpuMode, setCpuMode] = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);
  const [pendingCenter, setPendingCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [manualLatitude, setManualLatitude] = useState("");
  const [manualLongitude, setManualLongitude] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualLocationError, setManualLocationError] = useState<string | null>(null);
  const [manualTypes, setManualTypes] = useState<ManualIncidentType[]>([MANUAL_TYPE_OPTIONS[0].value]);
  const [manualTypeError, setManualTypeError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [pendingManualId, setPendingManualId] = useState<string | null>(null);
  const [confirmingManual, setConfirmingManual] = useState(false);
  const [confirmManualError, setConfirmManualError] = useState<string | null>(null);
  const [selectedActionError, setSelectedActionError] = useState<string | null>(null);
  const [isConfirmingSelected, setIsConfirmingSelected] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [serviceSelections, setServiceSelections] = useState<Record<string, ResponseService[]>>({});
  const [dispatchingServiceId, setDispatchingServiceId] = useState<string | null>(null);
  const [dispatchNotices, setDispatchNotices] = useState<Record<string, { message?: string; error?: string }>>({});

  // Dismissal persistence (localStorage)
  const dismissedIdsRef = useRef<Set<string>>(new Set());
  const pollTimersRef = useRef<Map<string, number>>(new Map());
  const [, force] = useState(0);
  const dismissedKey = "911:dismissedIds";
  const [dismissedHydrated, setDismissedHydrated] = useState(false);

  const persistDismissed = useCallback(() => {
    try {
      localStorage.setItem(dismissedKey, JSON.stringify(Array.from(dismissedIdsRef.current)));
    } catch {}
  }, []);

  // --- Helpers for marker styling ---
  // Normalize type strings like "Non-emergency:" → "non-emergency"
  const getTypeKey = (t?: string) => (t || "non-emergency").replace(/:\s*$/, "").trim().toLowerCase();

  // Human-friendly label without trailing colon; map known manual values
  const formatTypeLabel = (t?: string) => {
    if (!t) return "Unknown";
    const normalized = t.trim().toLowerCase();
    if (normalized in MANUAL_TYPE_LABEL) {
      return MANUAL_TYPE_LABEL[normalized as ManualIncidentType];
    }
    return t.replace(/:\s*$/, "");
  };

  const formatTypeList = (tags?: string[]) => {
    if (!tags || tags.length === 0) return null;
    return tags.map((tag) => formatTypeLabel(tag)).join(" | ");
  };

  // Map type → colors + icon path + fallback glyph
  const pinConfigFor = (typeKey: string) => {
    switch (typeKey) {
      case "crime":
        return { bg: "#dbeafe", border: "#1d4ed8", icon: "/icons/handcuffs.svg", fb: "🚓" };
      case "medical":
        return { bg: "#fee2e2", border: "#dc2626", icon: "/icons/cross.svg", fb: "✚" };
      case "fire":
        return { bg: "#ffedd5", border: "#ea580c", icon: "/icons/fire.svg", fb: "🔥" };
      case "non-emergency":
        return { bg: "#ffedd5", border: "#ea580c", icon: "/icons/info.svg", fb: "ⓘ" };
      default:
        return { bg: "#ff0000ff", border: "#6b7280", icon: "/icons/emergency.svg", fb: "🚨" };
    }
  };

  // Build a PinElement element; fallback to emoji glyph if the image fails
  const makePin = (iconUrl: string, bg: string, border: string, fallbackGlyph: string): Promise<HTMLElement> => {
    const img = document.createElement("img");
    img.src = iconUrl; // expects icons in /public/icons/...
    img.width = 20;
    img.height = 30;
    img.alt = "";
    img.style.display = "block";
    img.style.pointerEvents = "none";

    return new Promise<HTMLElement>((resolve) => {
      img.onerror = () => {
        const pin = new (google.maps as any).marker.PinElement({
          background: bg,
          borderColor: border,
          glyph: fallbackGlyph,
          glyphColor: "#111827",
        });
        resolve(pin.element);
      };
      img.onload = () => {
        const pin = new (google.maps as any).marker.PinElement({
          background: bg,
          borderColor: border,
          glyph: img,
        });
        resolve(pin.element);
      };
    });
  };
  // --- end helpers ---

  useEffect(() => {
    try {
      const raw = localStorage.getItem(dismissedKey);
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        dismissedIdsRef.current = new Set(arr);
      }
    } catch {}
    setDismissedHydrated(true);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === dismissedKey && e.newValue) {
        try {
          const arr: string[] = JSON.parse(e.newValue);
          dismissedIdsRef.current = new Set(arr);
          force((v) => v + 1);
          fetchIncidents();
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load Google Maps
  useEffect(() => {
    let cancelled = false;
    const initMap = async () => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!key) console.warn("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      try {
        setOptions({ key: key || "", v: "weekly" });
        await Promise.all([importLibrary("maps"), importLibrary("marker")]);
        if (cancelled || !mapRef.current) return;
        const m = new google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 11,
          mapId: "911-ops-map",
          disableDefaultUI: false,
        });
        m.addListener("dragstart", () => (userMovedRef.current = true));
        m.addListener("zoom_changed", () => (userMovedRef.current = true));
        setMap(m);
      } catch (error) {
        console.error("Failed to load Google Maps", error);
      } finally {
        if (!cancelled) setLoadingMap(false);
      }
    };
    initMap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch existing incidents
  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch("/api/incidents");
      if (!res.ok) return;
      const data: Incident[] = await res.json();
      setIncidents((prev) => {
        const manual = prev.filter((inc) => inc.id.startsWith("manual-") && !data.some((remote) => remote.id === inc.id));
        const merged = [...manual, ...data];
        return merged.filter((i) => !dismissedIdsRef.current.has(i.id));
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!dismissedHydrated) return;
    fetchIncidents();
    const id = setInterval(fetchIncidents, 5000);
    return () => clearInterval(id);
  }, [fetchIncidents, dismissedHydrated]);

  useEffect(() => {
    if (!selectedIncident) return;
    const latest = incidents.find((inc) => inc.id === selectedIncident.id);
    if (latest && latest !== selectedIncident) {
      setSelectedIncident(latest);
    }
  }, [incidents, selectedIncident]);

  // Render markers
  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    const render = async () => {
      // If a specific center was requested, apply it once and clear it
      if (pendingCenter) {
        map.panTo(pendingCenter);
        map.setZoom(13);
        setPendingCenter(null);        // ✅ clear so it doesn't keep re-centering
        autoPannedRef.current = true;  // we've already autopanned once
      }

      // clear previous markers
      (map as any).__markers?.forEach((mk: google.maps.marker.AdvancedMarkerElement) => (mk.map = null));
      (map as any).__markers = [];

      if (!(google.maps as any)?.marker?.AdvancedMarkerElement) {
        console.error("Marker library not loaded yet.");
        return;
      }

      for (const inc of incidents) {
        if (cancelled) break;
        if (!inc.location) continue;

        const typeKey = getTypeKey(inc.emergencyType);
        const cfg = pinConfigFor(typeKey);

        // Build pin content (with fallback)
        const contentEl = await makePin(cfg.icon, cfg.bg, cfg.border, cfg.fb);

        const marker = new (google.maps as any).marker.AdvancedMarkerElement({
          map,
          position: inc.location as google.maps.LatLngLiteral,
          title: inc.emergencyType || "Incident",
          content: contentEl,
          collisionBehavior: (google.maps as any).CollisionBehavior?.REQUIRED,
          zIndex: 1000,
        });

        marker.addListener("click", () => {
          userMovedRef.current = true; // a click implies intent—don't auto-jump elsewhere
          focusIncidentLocation(inc);
          setSelectedIncident(inc);
        });

        (map as any).__markers.push(marker);
      }

      // Gentle autopan ONCE to the newest marker, only if the user hasn't acted and nothing is selected
      if (!autoPannedRef.current && !userMovedRef.current && !selectedIncident) {
        const latestWithLoc = [...incidents].reverse().find((i) => i.location);
        if (latestWithLoc) {
          map.panTo(latestWithLoc.location as google.maps.LatLngLiteral);
          autoPannedRef.current = true; // ✅ do this only once
        }
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [incidents, map, pendingCenter, selectedIncident]);

  const focusIncidentLocation = (incident: Incident) => {
    userMovedRef.current = true;
    if (!incident.location) return;
    const coords = incident.location as google.maps.LatLngLiteral;
    if (map) {
      map.panTo(coords);
      map.setZoom(13);
    } else {
      setPendingCenter(coords);
    }
    setSelectedIncident(incident);
  };

  const handleManualLocationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const hasCoords = manualLatitude.trim() !== "" && manualLongitude.trim() !== "";
    const hasAddress = manualAddress.trim() !== "";
    if (!hasCoords && !hasAddress) {
      setManualLocationError("Enter coordinates or an address to center the map.");
      return;
    }

    setManualLocationError(null);
    setManualTypeError(null);
    setIsGeocoding(true);

    try {
      let coords: google.maps.LatLngLiteral | null = null;
      let resolvedAddress = manualAddress.trim();

      if (manualTypes.length === 0) {
        throw new Error("Select at least one incident type.");
      }

      if (hasCoords) {
        const lat = Number(manualLatitude);
        const lng = Number(manualLongitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) throw new Error("Latitude and longitude must be valid numbers.");
        coords = { lat, lng };
      } else if (hasAddress) {
        if (typeof google === "undefined" || !(google.maps as any)?.Geocoder) {
          throw new Error("Maps API not ready. Please wait a moment and try again.");
        }
        const geocoder = new google.maps.Geocoder();
        const geocodeResult = await geocoder.geocode({ address: resolvedAddress });
        if (!geocodeResult.results?.length) throw new Error("No results for that address.");
        const best = geocodeResult.results[0];
        coords = best.geometry.location?.toJSON();
        resolvedAddress = best.formatted_address || resolvedAddress;
      }

      if (!coords) throw new Error("Unable to resolve coordinates.");

      if (map) {
        map.panTo(coords);
        map.setZoom(13);
      } else {
        setPendingCenter(coords);
      }

      const primaryType = manualTypes[0] ?? MANUAL_TYPE_OPTIONS[0].value;
      const manualEntry: Incident = {
        id: `manual-${Date.now()}`,
        createdAt: new Date().toISOString(),
        emergencyType: primaryType,
        emergencyTags: manualTypes,
        confidence: undefined,
        transcript: resolvedAddress ? `Operator note: ${resolvedAddress}` : undefined,
        location: { lat: coords.lat, lng: coords.lng, address: resolvedAddress || undefined },
        status: "needs_confirmation",
      };
      setIncidents((prev) => [manualEntry, ...prev]);
      setPendingManualId(manualEntry.id);
      setConfirmManualError(null);
      setManualLatitude("");
      setManualLongitude("");
      setManualAddress("");
      setManualTypes([MANUAL_TYPE_OPTIONS[0].value]);
      setManualTypeError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to center on that location.";
      if (message.toLowerCase().includes("incident type")) {
        setManualTypeError(message);
        setManualLocationError(null);
      } else {
        setManualLocationError(message);
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  // Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: "audio/webm" });
          await uploadBlob(blob, `call-${Date.now()}.webm`);
        } catch (err) {
          console.error("Auto-upload failed:", err);
          setUploadError("Auto-upload failed. Try again.");
        } finally {
          setAudioChunks([]);
        }
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
    } catch (e) {
      alert("Microphone access failed. Check permissions.");
      console.error(e);
    }
  };

  const stopRecording = () => {
    if (!recorder) return;
    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  const uploadBlob = (blob: Blob, filename = `call-${Date.now()}.webm`) => {
    return new Promise<{ id: string }>((resolve, reject) => {
      setUploadError(null);
      setSelectedUploadName(filename);
      setUploadProgress(0);

      const form = new FormData();
      form.append("file", blob, filename);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/calls");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const p = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(p);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const id = data.id as string;
            setUploadProgress(null);
            setSelectedUploadName(null);
            setUploadingId(id);
            setTimeout(() => setUploadingId((curr) => (curr === id ? null : curr)), 1200);
          } catch (err) {
            setUploadError("Invalid server response");
            setUploadProgress(null);
          }
        } else {
          setUploadError(`Upload failed (${xhr.status})`);
          setUploadProgress(null);
        }
      };

      xhr.onerror = () => {
        setUploadError("Network error during upload");
        setUploadProgress(null);
        reject(new Error("Network error"));
      };

      xhr.send(form);
    });
  };

  const handleUploadInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadBlob(file, file.name);
  };

  const submitRecording = async () => {
    if (!audioChunks.length) return;
    const blob = new Blob(audioChunks, { type: "audio/webm" });
    await uploadBlob(blob);
    setAudioChunks([]);
  };

  const pollJob = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 120;
    const interval = 5000;

    const timer = setInterval(async () => {
      attempts++;

      try {
        const res = await fetch(`/api/calls/${id}`);
        if (!res.ok) {
          return;
        }
        const data: Incident = await res.json();

        setIncidents((prev) => {
          const idx = prev.findIndex((p) => p.id === data.id);
          const next = [...prev];
          if (idx >= 0) next[idx] = { ...next[idx], ...data };
          else next.unshift(data);
          return next;
        });

        if (data.status === "needs_confirmation" || data.status === "done") {
          setUploadingId((curr) => (curr === id ? null : curr));
        }

        if (data.status === "done") {
          clearInterval(timer);
        }
      } catch (e) {
        console.error(e);
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);
        setUploadingId((curr) => (curr === id ? null : curr));
      }
    }, interval);
  };

  const confirmIncident = async (incident: Incident): Promise<Incident | null> => {
    const payload: {
      id?: string;
      address?: string;
      location?: Incident["location"];
      emergencyType?: string;
      emergencyTags?: string[];
      transcript?: string;
      notes?: string;
      createdAt?: string;
    } = {};
    if (incident.id) payload.id = incident.id;
    const address = incident.location?.address?.trim();
    if (address) payload.address = address;
    if (incident.location) payload.location = incident.location;
    if (incident.emergencyType) payload.emergencyType = incident.emergencyType;
    if (incident.emergencyTags?.length) payload.emergencyTags = incident.emergencyTags;
    if (incident.transcript) payload.transcript = incident.transcript;
    if (incident.transcript && !incident.notes) payload.notes = incident.transcript;
    if (incident.notes) payload.notes = incident.notes;
    if (incident.createdAt) payload.createdAt = incident.createdAt;

    try {
      const res = await fetch(`/api/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Confirmation failed");
      const data: Incident = await res.json();

      setIncidents((prev) => {
        let hasMatch = false;
        let next = prev.map((p) => {
          if (p.id === data.id) {
            hasMatch = true;
            return { ...p, ...data };
          }
          return p;
        });
        if (!hasMatch) {
          next = [data, ...next];
        }
        if (incident.id && incident.id.startsWith("manual-") && incident.id !== data.id) {
          next = next.filter((p) => p.id !== incident.id);
        }
        return next;
      });

      setSelectedIncident((current) => {
        if (!current) return current;
        if (current.id === data.id) return { ...current, ...data };
        if (current.id === incident.id && incident.id !== data.id) return { ...data };
        return current;
      });

      setUploadingId((curr) => (curr === incident.id || curr === data.id ? null : curr));

      if (pendingManualId === incident.id) setPendingManualId(null);
      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const quickPins = useMemo(() => incidents.filter((inc) => inc.location).slice(0, 3), [incidents]);
  const pendingManualIncident = useMemo(
    () => (pendingManualId ? incidents.find((inc) => inc.id === pendingManualId) || null : null),
    [incidents, pendingManualId]
  );

  const handleConfirmPendingManual = async () => {
    if (!pendingManualIncident) return;
    setConfirmingManual(true);
    setConfirmManualError(null);
    const result = await confirmIncident(pendingManualIncident);
    if (result) {
      setPendingManualId(null);
    } else {
      setConfirmManualError("Unable to confirm marker. Try again.");
    }
    setConfirmingManual(false);
  };

  const extractPostalCode = (address?: string | null) => {
    if (!address) return null;
    const match = address.match(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b|\b\d{5}(?:-\d{4})?\b/i);
    return match ? match[0] : null;
  };

  const handleKeepSelected = () => {
    if (!selectedIncident) return;
    setIncidents((prev) => prev.map((p) => (p.id === selectedIncident.id ? { ...p, confirmedAt: null } : p)));
    setSelectedIncident(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedIncident) return;
    setIsDeletingSelected(true);
    setSelectedActionError(null);

    const id = selectedIncident.id;

    dismissedIdsRef.current.add(id);
    persistDismissed();
    force((v) => v + 1);

    const timer = pollTimersRef.current.get(id);
    if (timer) {
      clearInterval(timer);
      pollTimersRef.current.delete(id);
    }

    setIncidents((prev) => prev.filter((inc) => inc.id !== id));
    if (pendingManualId === id) setPendingManualId(null);

    setTimeout(() => {
      setIsDeletingSelected(false);
      setSelectedIncident(null);
    }, 200);
  };

  const toggleServiceSelection = (incidentId: string, service: ResponseService) => {
    setServiceSelections((prev) => {
      const next = new Set(prev[incidentId] ?? []);
      if (next.has(service)) next.delete(service);
      else next.add(service);
      return { ...prev, [incidentId]: Array.from(next) };
    });
    setDispatchNotices((prev) => {
      const next = { ...prev };
      delete next[incidentId];
      return next;
    });
  };

  const handleDispatchServices = async (incident: Incident) => {
    const selected = serviceSelections[incident.id] ?? [];
    if (!selected.length) {
      setDispatchNotices((prev) => ({ ...prev, [incident.id]: { error: "Pick at least one service." } }));
      return;
    }

    setDispatchingServiceId(incident.id);
    setDispatchNotices((prev) => ({ ...prev, [incident.id]: { message: undefined, error: undefined } }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const labelList = selected
        .map((key) => RESPONSE_SERVICE_OPTIONS.find((opt) => opt.key === key)?.label || key)
        .join(", ");
      setDispatchNotices((prev) => ({ ...prev, [incident.id]: { message: `Sent: ${labelList}` } }));
    } catch (err) {
      console.error(err);
      setDispatchNotices((prev) => ({ ...prev, [incident.id]: { error: "Failed to dispatch services." } }));
    } finally {
      setDispatchingServiceId((curr) => (curr === incident.id ? null : curr));
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] w-full p-4 grid grid-cols-1 lg:grid-cols-[30%_70%] gap-4">
      {/* Left: Controls */}
      <Card className="p-4 flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-neutral-500" />
            <h1 className="text-xl text-black font-semibold">911 Operator Dashboard</h1>
          </div>
        </div>

        {/* Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <SectionTitle>Upload Recording</SectionTitle>
            <div className="mt-3 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="file" accept="audio/*" className="hidden" onChange={handleUploadInput} />
                <span className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm border border-neutral-200 hover:shadow transition active:translate-y-[1px] bg-black text-white hover:opacity-90">
                  <Upload className="w-4 h-4" /> Choose file
                </span>
              </label>
              {uploadingId && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Loader2 className="w-[10px] h-[10px] animate-spin" />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-neutral-500">Supported: .mp3, .wav, .m4a, .webm</p>
          </Card>

          {/* Recorder */}
          <Card className="p-4">
            <SectionTitle>Record Live Call</SectionTitle>
            <div className="mt-3 flex items-center gap-3">
              {!isRecording ? (
                <Button className="bg-black text-white hover:opacity-90" onClick={startRecording}>
                  <Mic className="w-4 h-4" /> Start
                </Button>
              ) : (
                <Button className="bg-red-600 text-white hover:opacity-90" onClick={stopRecording}>
                  <Square className="w-4 h-4" /> Stop
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-neutral-500">Record, then submit for transcription + analysis.</p>
          </Card>
        </div>

        {/* Calls list */}
        <div>
          <SectionTitle>Recent Calls</SectionTitle>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="mt-3 flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-2"></div>
            {incidents.length === 0 && <div className="text-sm text-neutral-500">No calls yet.</div>}
            {incidents.map((inc) => (
              <Card key={inc.id} className="p-3 relative">
                <div className="absolute top-3 right-3">
                  {inc.status === "processing" && (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" /> Processing
                    </span>
                  )}
                  {inc.status === "needs_confirmation" && (
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-xs">
                      <TriangleAlert className="w-3 h-3" /> Needs confirmation
                    </span>
                  )}
                  {inc.status === "done" && (
                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs">
                      <CheckCircle2 className="w-3 h-3" /> Parsed
                    </span>
                  )}
                </div>

                <div className="pr-32">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="text-neutral-500">{new Date(inc.createdAt || Date.now()).toLocaleString()}</span>
                  </div>

                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-neutral-500">Type:</span>{" "}
                      <span className="text-black">
                        {inc.emergencyTags?.length ? formatTypeList(inc.emergencyTags) : formatTypeLabel(inc.emergencyType)}
                      </span>
                      {typeof inc.confidence === "number" && <span className="ml-2 text-black">({Math.round((inc.confidence || 0) * 100)}%)</span>}
                    </div>

                    <div>
                      <span className="text-neutral-500">Location:</span>{" "}
                      {inc.location ? (
                        <span className="text-black">{inc.location.address || `${inc.location.lat.toFixed(5)}, ${inc.location.lng.toFixed(5)}`}</span>
                      ) : (
                        <span className="text-black">—</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-neutral-500 shrink-0">Transcript:</span>
                      <span className="text-black flex-1 min-w-0 truncate" title={inc.transcript || "—"}>
                        {inc.transcript || "—"}
                      </span>
                    </div>
                    {inc.flags && (
                      <div className="text-xs text-neutral-600 mt-1">
                        {inc.flags.brokenAccent && <span className="mr-2">• Possible accent</span>}
                        {inc.flags.intoxicated && <span className="mr-2">• Possible intoxication</span>}
                        {inc.flags.suspectedSwatting && <span className="mr-2">• Possible fake call</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    className="flex-1 justify-center text-black"
                    onClick={() => {
                      focusIncidentLocation(inc);
                      setSelectedIncident(inc);
                    }}
                  >
                    <MapPin className="w-4 h-4" /> View on map
                  </Button>
                  {cpuMode && inc.status === "needs_confirmation" && (
                    <Button className="flex-1 justify-center bg-black text-white" onClick={() => confirmIncident(inc)}>
                      Confirm & Mark
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {/* Right: Map & Inspector */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0" ref={mapRef} />
        {loadingMap && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
        <div className="pointer-events-none absolute top-4 left-4 flex flex-col gap-3 w-full max-w-sm">
          <div className="rounded-3xl bg-white border border-neutral-200 shadow-xl p-4 pointer-events-auto">
            <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Manual address</div>
            <form className="mt-3 flex flex-col gap-3 text-black" onSubmit={handleManualLocationSubmit}>
              <label className="text-xs font-medium text-black">Address or notes</label>
              <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 px-3 py-2">
                <Search className="w-4 h-4 text-black" />
                <input
                  type="text"
                  placeholder="123 Main St, Long Beach"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="flex-1 text-sm focus:outline-none placeholder:text-neutral-400"
                />
              </div>
              {manualLocationError && <div className="text-xs text-red-600">{manualLocationError}</div>}
              <div className="flex gap-2">
                <Button className="bg-black text-white hover:opacity-90 flex-1 justify-center" type="submit" disabled={isGeocoding}>
                  {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />} Apply
                </Button>
                <Button
                  type="button"
                  className="flex-1 justify-center"
                  onClick={() => {
                    setManualLatitude("");
                    setManualLongitude("");
                    setManualAddress("");
                    setManualLocationError(null);
                    setManualTypes([MANUAL_TYPE_OPTIONS[0].value]);
                    setManualTypeError(null);
                    setIsGeocoding(false);
                  }}
                >
                  Clear
                </Button>
              </div>
              <div>
                <label className="text-xs font-medium text-black">Incident type</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MANUAL_TYPE_OPTIONS.map((option) => {
                    const isActive = manualTypes.includes(option.value);
                    console.log(option.value, isActive);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setManualTypes((prev) => {
                            const exists = prev.includes(option.value);
                            if (exists) {
                              if (prev.length === 1) return prev; // keep at least one selection
                              return prev.filter((val) => val !== option.value);
                            }
                            return [...prev, option.value];
                          });
                          setManualTypeError(null);
                        }}
                        className={`rounded-2xl border px-3 py-1 text-sm transition ${
                          isActive ? "bg-black text-white border-black" : "border-neutral-200 text-black hover:border-black/40"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {manualTypeError && <div className="text-xs text-red-600">{manualTypeError}</div>}
              </div>
            </form>
          </div>

          <div className="rounded-3xl bg-white border border-neutral-200 shadow-xl p-4 pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-black">Recent pins</div>
              <span className="text-xs text-neutral-500">Tap to focus</span>
            </div>
            <div className="mt-3 space-y-2">
              {quickPins.length === 0 && <div className="text-xs text-neutral-500">Add a manual location to build quick pins.</div>}
              {quickPins.map((pin) => (
                <button
                  key={pin.id}
                  type="button"
                  className="w-full text-left flex items-center gap-3 rounded-2xl border border-neutral-100 hover:bg-neutral-50 px-3 py-2 transition"
                  onClick={() => focusIncidentLocation(pin)}
                >
                  <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-black">
                      {pin.location?.address || `${pin.location?.lat.toFixed(4)}, ${pin.location?.lng.toFixed(4)}`}
                    </div>
                    <div className="text-xs text-black truncate">
                      {pin.emergencyTags?.length ? formatTypeList(pin.emergencyTags) : formatTypeLabel(pin.emergencyType) || "Manual entry"}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedIncident && (
          <div className="pointer-events-none absolute top-4 right-4 w/full max-w-sm">
            <div className="pointer-events-auto rounded-3xl bg-white border border-neutral-200 shadow-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Marker details</div>
                  <div className="text-lg font-semibold text-neutral-900">{selectedIncident.id}</div>
                </div>
                <Button className="text-sm text-black" onClick={() => setSelectedIncident(null)}>
                  Close
                </Button>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <span className="text-neutral-500">Address:</span> <span className="text-black">{selectedIncident.location?.address || "—"}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Type:</span>{" "}
                  <span className="text-black">
                    {selectedIncident.emergencyTags?.length
                      ? formatTypeList(selectedIncident.emergencyTags)
                      : formatTypeLabel(selectedIncident.emergencyType) || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Coordinates:</span>{" "}
                  <span className="text-black">
                    {selectedIncident.location ? `${selectedIncident.location.lat.toFixed(5)}, ${selectedIncident.location.lng.toFixed(5)}` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Status:</span> <span className="text-black">{selectedIncident.status}</span>
                </div>
                {selectedIncident.transcript && (
                  <div>
                    <span className="text-neutral-500">Notes:</span> <span className="text-black">{selectedIncident.transcript}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 border border-neutral-100 rounded-2xl p-3 bg-neutral-50">
                <div className="text-xs font-semibold text-neutral-600 uppercase">Dispatch services</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RESPONSE_SERVICE_OPTIONS.map((service) => {
                    const selections = serviceSelections[selectedIncident.id] ?? [];
                    const isActive = selections.includes(service.key);
                    return (
                      <button
                        key={service.key}
                        type="button"
                        className={`rounded-2xl border px-3 py-1 text-sm transition ${
                          isActive ? "bg-black text-white border-black" : "border-neutral-200 text-neutral-800 hover:border-black/50"
                        }`}
                        onClick={() => toggleServiceSelection(selectedIncident.id, service.key)}
                      >
                        {service.label}
                      </button>
                    );
                  })}
                </div>
                <Button
                  className="mt-3 w-full justify-center bg-black text-white hover:opacity-90"
                  type="button"
                  disabled={dispatchingServiceId === selectedIncident.id}
                  onClick={() => handleDispatchServices(selectedIncident)}
                >
                  {dispatchingServiceId === selectedIncident.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send units"}
                </Button>
                {dispatchNotices[selectedIncident.id]?.message && (
                  <div className="mt-2 text-xs text-green-700">{dispatchNotices[selectedIncident.id]?.message}</div>
                )}
                {dispatchNotices[selectedIncident.id]?.error && (
                  <div className="mt-2 text-xs text-red-600">{dispatchNotices[selectedIncident.id]?.error}</div>
                )}
              </div>
              {selectedActionError && <div className="mt-2 text-xs text-red-600">{selectedActionError}</div>}
              <div className="mt-4 flex flex-col gap-2">
                <Button className="justify-center bg-black text-white hover:opacity-90" type="button" onClick={handleKeepSelected} disabled={isConfirmingSelected || isDeletingSelected}>
                  Keep marker
                </Button>
                <Button className="justify-center border-red-200 text-red-700" type="button" onClick={handleDeleteSelected} disabled={isDeletingSelected}>
                  {isDeletingSelected ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete marker
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
