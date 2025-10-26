"use client";
import React from "react";
import { motion } from "framer-motion";
import { Github, Linkedin } from "lucide-react";

/**
 * TeamSection — for 911 Operator Assistant project
 * Members:
 *  - Hoang Khoi Do — Frontend Developer
 *  - Sy Nguyen Nguyen — Backend Developer
 *  - Kien Pham — Backend Developer
 *
 * Tech: React (TSX) + Tailwind + Framer Motion + lucide-react icons
 */

export default function TeamSection({ className = "" }: { className?: string }) {
  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
    viewport: { once: true },
  });

  const team = [
    {
      name: "Hoang Khoi Do",
      role: "Frontend Developer",
      img: "https://api.dicebear.com/7.x/avataaars/svg?seed=hoangkhoi",
      github: "https://github.com/Ben2104",
      linkedin: "https://www.linkedin.com/in/hoang-khoi-do/",
      accent: "red",
    },
    {
      name: "Sy Nguyen Nguyen",
      role: "Backend Developer",
      img: "https://api.dicebear.com/7.x/avataaars/svg?seed=synguyen",
      github: "https://github.com/synguyen446",
      linkedin: "https://www.linkedin.com/in/synguyen446/",
      accent: "emerald",
    },
    {
      name: "Kien Pham",
      role: "Backend Developer",
      img: "https://api.dicebear.com/7.x/avataaars/svg?seed=kienpham",
      github: "https://github.com/ki3n98/",
      linkedin: "https://www.linkedin.com/in/kien-t-pham/",
      accent: "blue",
    },
  ];

  return (
    <section id="team" className={`text-slate-100 py-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-6 text-center">
        <motion.h2 {...fade(0)} className="text-3xl sm:text-4xl font-bold text-black">
          Meet the Team
        </motion.h2>
        <motion.p {...fade(0.05)} className="mt-3 max-w-2xl mx-auto text-black">
          The minds behind the 911 Operator Assistant — a passionate trio building tools to help emergency services act faster.
        </motion.p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              {...fade(0.1 + i * 0.1)}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 hover:bg-slate-900/80 transition"
            >
              <div className="flex flex-col items-center">
                <img
                  src={member.img}
                  alt={member.name}
                  className={`h-28 w-28 rounded-full ring-4 ring-${member.accent}-500/40 shadow-lg`}
                />
                <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
                <p className="text-sm text-slate-400">{member.role}</p>

                <div className="mt-4 flex items-center gap-4">
                  <a href={member.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
                    <Github className="h-5 w-5" />
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.08),transparent_70%)]" />
    </section>
  );
}
