"use client";
import React from "react";
import { motion } from "framer-motion";
import { Brain, MapPin, Mic, AlertTriangle, Activity } from "lucide-react";

export default function About() {
  return (
    <section id="about" className=" text-slate-100 py-10 mt-[20rem] items-center justify-center">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        {/* 🟥 Problem Section */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-red-400">
              🚨 Seconds That Save Lives
            </h2>
            <p className="mt-4 text-black leading-relaxed">
              Every second counts in an emergency. 911 operators must stay calm while
              extracting critical details from panicked callers — but background noise,
              unclear speech, and confusion can delay response time.
            </p>
            <p className="mt-3 text-black  italic">
              Locating the caller’s address manually wastes precious seconds that could
              mean the difference between life and death.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-black">
            <li className="flex items-start gap-2">
              <AlertTriangle className="text-red-400 w-5 h-5 mt-0.5" />
              Operators deal with chaotic, unclear, or incomplete information.
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="text-red-400 w-5 h-5 mt-0.5" />
              They must listen, type, and decide simultaneously — under pressure.
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="text-red-400 w-5 h-5 mt-0.5" />
              Current systems rely heavily on manual address lookup or caller cooperation.
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="text-red-400 w-5 h-5 mt-0.5" />
              Delayed dispatch can slow emergency response and increase risk.
            </li>
          </ul>

          <div className="mt-6 text-sm text-black border-l-2 border-red-500 pl-4">
            ⏱️ Average delay in locating a caller:{" "}
            <span className="text-red-600 font-medium">20–90 seconds per call</span>
          </div>
        </motion.div>

        {/* 🟩 Solution Section */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-emerald-400">
              🧠 AI That Listens and Locates
            </h2>
            <p className="mt-4 text-black leading-relaxed">
              Our AI-powered assistant transforms 911 operations. It listens to
              emergency recordings, transcribes them in real time, extracts key details
              like street names, and pinpoints the location on Google Maps instantly.
            </p>
            <p className="mt-3 text-black italic">
              It even highlights keywords — like <span className="text-red-500">fire</span>,
              <span className="text-red-500"> injury</span>, or
              <span className="text-red-500"> weapon</span> — to recommend which services
              to dispatch.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <FeatureCard
              icon={<Mic className="w-5 h-5 text-emerald-400" />}
              title="Speech-to-Text AI"
              desc="Transcribes emergency calls instantly."
            />
            <FeatureCard
              icon={<MapPin className="w-5 h-5 text-emerald-400" />}
              title="Address Finder"
              desc="Extracts and validates the caller’s location."
            />
            <FeatureCard
              icon={<Activity className="w-5 h-5 text-emerald-400" />}
              title="Smart Response"
              desc="Suggests Police, Fire, or Medical services."
            />
            <FeatureCard
              icon={<Brain className="w-5 h-5 text-emerald-400" />}
              title="Operator-Friendly"
              desc="Designed to assist, not replace, human decision-making."
            />
          </div>
        </motion.div>
      </div>

      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.15),transparent_60%)]" />
    </section>
  );
}

// Small reusable feature card
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-white/10 p-4 hover:bg-slate-900/80 transition">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  );
}
