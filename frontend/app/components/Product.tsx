"use client";
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Upload, Brain, MapPin, ChevronRight, Server, Boxes, Globe2, Code2 } from "lucide-react";
/**
 * HowItWorksSection — Horizontal/Vertical 3‑step timeline + mini architecture diagram
 * Tailored for the 911 Operator Assistant project.
 *
 * Steps: Upload → Analyze → Decide
 * Diagram: Frontend (React) → Backend (FastAPI) → AI (STT + NLP) → Maps API
 *
 * Tech: React (TSX) + TailwindCSS + Framer Motion + lucide-react
 */

export default function Product({ className = "" }: { className?: string }) {
  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: "easeOut", delay },
    viewport: { once: true, margin: "-100px" },
  });

  return (
    <section id="product" className={`relative overflow-hidden text-slate-100 py-20 ml-[-6rem] ${className}`}>
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <motion.h2 {...fade(0)} className="text-3xl text-black sm:text-4xl font-bold tracking-tight">
          How It Works
        </motion.h2>
        <motion.p {...fade(0.06)} className="mt-3 max-w-3xl text-black">
          A simple, reliable flow that turns chaotic calls into clear, actionable intelligence.
        </motion.p>

        {/* Mini Architecture Diagram */}
        <motion.div {...fade(0.34)} className="mt-12">
          <div className="text-sm uppercase tracking-wide text-black mb-3">Architecture (at a glance)</div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center">
            <ArchCard icon={<Code2 className="h-20 w-20 text-black" />} title="Frontend" subtitle="Next.js + TypeScript" />
            <ArchArrow />
            <ArchCard icon={<Server className="h-20 w-20 text-black" />} title="Backend" subtitle="FastAPI / Node" />
            <ArchArrow />
            <ArchCard icon={<Brain className="h-20 w-20 text-black" />} title="AI" subtitle="Speech‑to‑Text + NLP" />
            <ArchArrow />
            <ArchCard icon={<Globe2 className="h-20 w-20 text-black" />} title="Maps API" subtitle="Google Maps / Geocoding" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}


function ArchCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 ring-1 ring-white/10">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10">
          {icon}
        </span>
        <div>
          <div className="text-sm font-medium text-slate-100">{title}</div>
          <div className="text-xs text-slate-400">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function ArchArrow() {
  return (
    <div className="hidden md:flex items-center justify-center" aria-hidden>
      <ChevronRight className="h-6 w-6 text-slate-400" />
    </div>
  );
}
