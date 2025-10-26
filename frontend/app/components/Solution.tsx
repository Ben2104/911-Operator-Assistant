"use client";
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mic, Brain, MapPin, ChevronRight, ShieldAlert } from "lucide-react";

/**
 * SolutionSection — “AI That Listens, Understands, and Acts”
 * Tailored for the 911 Operator Assistant project.
 *
 * - Tech: React (TSX) + Tailwind + Framer Motion + lucide-react icons
 * - Drop into a Next.js app. Dark-theme friendly. Accessible.
 * - Animates a 3-step flow: Audio In → AI Transcription/NLP → Map + Response Suggestion
 * - Minimal props; style via className or tweak copy inline.
 */

export default function Solution({ className = "" }: { className?: string }) {
  // Ensure we always pass a boolean to downstream components
  const prefersReducedMotion = useReducedMotion() ?? false;

  // Return `any` here to avoid strict Framer Motion Transition typing issues
  // when spreading these props onto motion components.
  const fadeUp = (delay = 0): any => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    // Use a numeric bezier easing array to satisfy Framer Motion's TypeScript types
    // (string names like "easeOut" are not accepted by the Transition type).
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
    viewport: { once: true, margin: "-80px" },
  });

  return (
    <section id="solution" className={`relative  text-slate-100 py-20 ${className}`}>
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-80 w-80 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        {/* Heading & lead */}
        <motion.h2 {...fadeUp(0)} className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
          AI That Listens, Understands, and Acts
        </motion.h2>
        <motion.p
          {...fadeUp(0.06)}
          className="mt-4 max-w-3xl text-black leading-relaxed"
        >
          Our assistant transforms chaotic emergency calls into clear, actionable insights. It listens to
          the caller, transcribes the speech, detects key details like street names and emergency types,
          and marks the exact spot on a live map. Within seconds, it suggests which responders — Police,
          Fire, or Medical — should be dispatched.
        </motion.p>

        {/* Flow diagram */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch">
          {/* Step 1 */}
          <StepCard
            {...fadeUp(0.12)}
            icon={<Mic className="h-5 w-5 text-red-400" aria-hidden />}
            title="Audio In"
            desc="Upload or stream the emergency call for instant processing."
            badge="Input"
            accent="red"
          />

          <Connector delay={0.18} />

          {/* Step 2 */}
          <StepCard
            {...fadeUp(0.2)}
            icon={<Brain className="h-5 w-5 text-emerald-400" aria-hidden />}
            title="AI Transcription + NLP"
            desc="Speech-to-text with entity extraction for addresses, landmarks, and danger keywords."
            badge="Analysis"
            accent="emerald"
          />

          <Connector delay={0.26} />

          {/* Step 3 */}
          <StepCard
            {...fadeUp(0.28)}
            icon={<MapPin className="h-5 w-5 text-blue-400" aria-hidden />}
            title="Map + Response Suggestion"
            desc="Pinpoint location on Google Maps and recommend Police, Fire, or Medical services."
            badge="Action"
            accent="blue"
          >
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-1 ring-1 ring-blue-400/30">
                <ShieldAlert className="h-3.5 w-3.5" /> Dispatch recommendation
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 ring-1 ring-emerald-400/30">
                NLP keywords: fire, injury, weapon
              </span>
            </div>
          </StepCard>
        </div>

        {/* Under the Hood card */}
        <motion.div
          {...fadeUp(0.34)}
          className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-5"
        >
          <div className="text-sm uppercase tracking-wide text-white mb-2">Under the Hood</div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-slate-300">
            <li className="rounded-lg bg-slate-800/60 p-3 ring-1 ring-white/10">🎙️ Speech Recognition — Whisper / STT</li>
            <li className="rounded-lg bg-slate-800/60 p-3 ring-1 ring-white/10">🔎 Entity Extraction — custom NLP for addresses & cues</li>
            <li className="rounded-lg bg-slate-800/60 p-3 ring-1 ring-white/10">🗺️ Geocoding — Google Maps API → coordinates</li>
            <li className="rounded-lg bg-slate-800/60 p-3 ring-1 ring-white/10">🚨 Decision Engine — rule + keyword model</li>
          </ul>
        </motion.div>

        {/* Micro-visual: soundwave → transcript → pin */}
        <motion.div
          {...fadeUp(0.4)}
          className="mt-10 grid gap-4 sm:grid-cols-3"
          aria-label="Illustration of audio to map flow"
        >
          <Waveform prefersReducedMotion={prefersReducedMotion} />
          <TranscriptCard />
        </motion.div>
      </div>
    </section>
  );
}

function StepCard({
  icon,
  title,
  desc,
  badge,
  accent = "red",
  children,
  initial,
  whileInView,
  transition,
  viewport,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge: string;
  accent?: "red" | "emerald" | "blue";
  children?: React.ReactNode;
  initial?: any;
  whileInView?: any;
  transition?: any;
  viewport?: any;
}) {
  const ring =
    accent === "red"
      ? "ring-red-400/30"
      : accent === "emerald"
      ? "ring-emerald-400/30"
      : "ring-blue-400/30";
  const dot =
    accent === "red"
      ? "bg-red-400"
      : accent === "emerald"
      ? "bg-emerald-400"
      : "bg-blue-400";

  return (
    <motion.div
      initial={initial}
      whileInView={whileInView}
      transition={transition}
      viewport={viewport}
      className={`rounded-2xl border border-white/10 bg-slate-900/60 p-5 ring-1 ${ring}`}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${dot}/20 ring-1 ${ring}`}>
          {icon}
        </span>
        <span className="text-xs uppercase tracking-wide text-slate-400">{badge}</span>
      </div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-300">{desc}</p>
      {children}
    </motion.div>
  );
}

function Connector({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      aria-hidden
      className="hidden lg:flex items-center justify-center"
    >
      <ChevronRight className="h-6 w-6 text-slate-400" />
    </motion.div>
  );
}

function Waveform({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="text-xs uppercase tracking-wide text-white">Audio In</div>
      <div className="mt-2 h-16 w-full overflow-hidden rounded-md bg-slate-800/60 ring-1 ring-white/10">
        {/* simple CSS pulse bars as a pseudo waveform */}
        <div className="flex h-full items-end gap-1 p-2">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-slate-500/70"
              style={{
                height: prefersReducedMotion ? 20 : 8 + ((i * 37) % 28),
                animation: prefersReducedMotion ? undefined : `wave ${0.9 + (i % 5) * 0.07}s ease-in-out ${i * 0.02}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes wave {
          from { transform: scaleY(0.6); opacity: 0.8; }
          to { transform: scaleY(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function TranscriptCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="text-xs uppercase tracking-wide text-white">AI Transcription + NLP</div>
      <div className="mt-2 rounded-md bg-slate-800/60 p-3 text-sm ring-1 ring-white/10">
        <p className="font-mono text-slate-200">
          Caller: There's heavy <span className="text-red-300">smoke</span> on the 3rd floor... I think the address is
          <span className="text-emerald-300"> 233 S Wacker Dr</span>.
        </p>
      </div>
    </div>
  );
}
