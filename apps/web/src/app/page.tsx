"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  useInView,
  animate,
} from "framer-motion";
import Link from "next/link";
import { useRef, useEffect, useState, ReactNode } from "react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] });

import FeatureSkyline from "@/components/FeatureSkyline";
import BlueprintGrid from "@/components/BlueprintGrid";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { HyperText } from "@/components/ui/hyper-text";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { AnimatedBackground } from "@/components/core/animated-background";
import { TextEffect } from "@/components/core/text-effect";
import { MinimalFooter } from "@/components/ui/minimal-footer";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────
   (Gradient backgrounds removed for editorial style)
───────────────────────────────────────── */
function GradientBackground() {
  return null;
}

/* ─────────────────────────────────────────
   Floating dashboard mockup
───────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div
      className="relative w-full max-w-4xl mx-auto mt-12"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        initial={{ rotateX: 28, y: 70, opacity: 0 }}
        animate={{ rotateX: 12, y: 0, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative"
      >
        <div className="absolute inset-x-16 bottom-0 h-28 bg-[#0052ff]/20 blur-3xl translate-y-12 pointer-events-none" />

        <div className="relative bg-[#1a1a1a] border border-white/[0.06] overflow-hidden shadow-[0_80px_140px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.03)]">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04] bg-[#161616]">
            <div className="w-3 h-3 bg-white/[0.08]" />
            <div className="w-3 h-3 bg-white/[0.08]" />
            <div className="w-3 h-3 bg-white/[0.08]" />
            <div className="flex-1 mx-6 h-6 bg-white/[0.02] flex items-center px-4">
              <span className="text-xs text-white/20 font-mono tracking-wide">
                lore.app/dashboard
              </span>
            </div>
          </div>

          <div className="flex">
            <div className="w-16 bg-[#161616] border-r border-white/[0.03] py-6 flex flex-col items-center gap-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6  ${i === 0 ? "bg-[#0052ff]/50" : "bg-white/[0.03]"}`}
                />
              ))}
            </div>

            <div className="flex-1 p-8 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: "Decisions",
                    value: "847",
                    color: "#0052ff",
                    delta: "+12 this week",
                  },
                  {
                    label: "Knowledge Silos",
                    value: "3",
                    color: "#ef4444",
                    delta: "↑ 1 critical",
                  },
                  {
                    label: "ADRs Generated",
                    value: "24",
                    color: "#10b981",
                    delta: "2 pending review",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-transparent border border-white/[0.04] p-5"
                  >
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
                      {card.label}
                    </p>
                    <p
                      className="text-4xl font-semibold mb-1 tracking-tight"
                      style={{ color: card.color }}
                    >
                      {card.value}
                    </p>
                    <p className="text-[11px] text-white/20">{card.delta}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest px-1 mb-4">
                  Recent decisions
                </p>
                <div className="space-y-2">
                  {[
                    {
                      text: "Switched from AWS to GCP — cost reduction",
                      author: "@alice",
                      time: "2d ago",
                      ok: true,
                    },
                    {
                      text: "Banned Redux — migrated to Zustand",
                      author: "@bob",
                      time: "5d ago",
                      ok: true,
                    },
                    {
                      text: "Removed Tailwind from dashboard bundle",
                      author: "@carol (left)",
                      time: "1w ago",
                      ok: false,
                    },
                  ].map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 bg-white/[0.01] border border-white/[0.03] px-5 py-4"
                    >
                      <div
                        className={`w-2 h-2  flex-shrink-0 ${d.ok ? "bg-green-400/50" : "bg-red-400/60 animate-pulse"}`}
                      />
                      <p className="text-xs text-white/50 flex-1 truncate font-medium">
                        {d.text}
                      </p>
                      <span className="text-[11px] text-white/25 flex-shrink-0">
                        {d.author}
                      </span>
                      <span className="text-[11px] text-white/20 flex-shrink-0 font-mono">
                        {d.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-500/[0.04] border border-red-500/10 px-5 py-4 flex items-start gap-4">
                <div className="w-2 h-2 bg-red-400 mt-1.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs text-red-400/80 font-medium mb-1">
                    PR Blocker fired — #PR-412
                  </p>
                  <p className="text-[11px] text-white/30 leading-relaxed">
                    Redux re-introduced · blocked by @alice's decision (Mar 3) ·
                    Reason: bundle size
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Auto-scrolling marquee strip
───────────────────────────────────────── */
function MarqueeStrip() {
  const items = [
    "Decision Memory",
    "PR Blocker",
    "Knowledge Heatmap",
    "ADR Generator",
    "GitHub Integration",
    "Slack Integration",
    "Jira Integration",
    "Cognee Graph",
    "Decision Memory",
    "PR Blocker",
    "Knowledge Heatmap",
    "ADR Generator",
    "GitHub Integration",
    "Slack Integration",
    "Jira Integration",
    "Cognee Graph",
  ];
  return (
    <div className="relative w-full overflow-hidden border-y border-white/20 bg-[#161616] py-8 z-10">
      <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#161616] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-[#161616] to-transparent z-10 pointer-events-none" />
      <div className="flex animate-marquee whitespace-nowrap select-none">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-6 mx-12 text-sm text-white/20 font-medium uppercase tracking-[0.2em]"
          >
            <span className="w-1.5 h-1.5 bg-[#0052ff]/40" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   3D-tilt glassmorphism feature card
───────────────────────────────────────── */
function FeatureCard({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  index: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-120, 120], [4, -4]);
  const rotateY = useTransform(x, [-120, 120], [-4, 4]);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.9,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative bg-transparent border border-white/[0.04] p-12 cursor-default group hover:border-white/[0.08] transition-colors duration-500"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg,rgba(0,82,255,0.03) 0%,transparent 100%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0052ff]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10">
        <div className="w-14 h-14 bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-10 text-white/40 group-hover:text-[#0052ff] group-hover:border-[#0052ff]/20 group-hover:bg-[#0052ff]/[0.03] transition-all duration-500">
          {icon}
        </div>
        <h3 className="text-3xl font-medium mb-5 text-white/90 tracking-tight">
          {title}
        </h3>
        <p className="text-white/40 leading-relaxed font-light text-lg">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Animated count-up number for stats section
───────────────────────────────────────── */
function CountUpNumber({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const count = useMotionValue(0);
  const roundedCount = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 2.5,
        ease: "easeOut",
      });
      return () => controls.stop();
    }
  }, [isInView, count, value]);

  return (
    <span ref={ref}>
      <motion.span>{roundedCount}</motion.span>
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────
   Shared section label
───────────────────────────────────────── */
function Label({ text }: { text: string }) {
  return (
    <p className="text-xs font-mono text-[#0052ff] uppercase tracking-[0.25em] mb-8">
      {text}
    </p>
  );
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
export default function LandingPage() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 32 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const features = [
    {
      title: "Decision Memory",
      description:
        'Ask anything. "Why did we choose Postgres?" "Who decided to remove Tailwind?" Lore answers from the graph — with context, attribution, and the original PR link. Works directly in Slack.',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      title: "PR Blocker",
      description:
        "When a new PR tries to re-introduce a banned library or reverse a past decision, Lore blocks the merge automatically. The comment explains exactly why — and names the person who made the call.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="18" r="3" />
          <circle cx="6" cy="6" r="3" />
          <path d="M13 6h3a2 2 0 0 1 2 2v7" />
          <line x1="6" y1="9" x2="6" y2="21" />
        </svg>
      ),
    },
    {
      title: "Risk Heatmap",
      description:
        "A live map of your codebase showing where knowledge is dangerously concentrated. When only one person understands a critical system — and that person might leave — the tile turns red.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12h4l3-9 5 18 3-9h5" />
        </svg>
      ),
    },
    {
      title: "ADR Generator",
      description:
        "Every significant merge auto-generates a draft Architecture Decision Record. Review it, approve it, and Lore opens a PR with the ADR markdown committed to your repo.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen relative font-sans bg-[#161616] selection:bg-[#0052ff]/25 text-white">
      <BlueprintGrid />

      {/* ── NAV ─────────────────────────────── */}
      <motion.nav 
        initial={{ opacity: 0 }}
        animate={{ opacity: isSplashComplete ? 1 : 0 }}
        transition={{ duration: 1 }}
        className="fixed top-0 w-full z-50 bg-[#161616]/80 backdrop-blur-2xl border-b border-white/20"
      >
        <div className="mx-36 px-8 flex items-center h-24">
          <div className="flex items-center gap-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <polygon points="4,22 11,16.75 11,2.75 4,8" fill="#0052ff" />
              <polygon points="12,22 20,22 20,10 12,16" fill="#0052ff" />
            </svg>
            <span className="font-serif font-medium text-2xl tracking-tight">
              Lore
            </span>
          </div>
          <div className="hidden md:flex items-center text-lg font-['Arial'] font-medium text-white/40 ml-auto mr-8">
            <AnimatedBackground
              className="bg-white/10"
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.3,
              }}
              enableHover
            >
              <Link
                href="#features"
                data-id="features"
                className="px-5 py-2 hover:text-white transition-colors duration-300"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                data-id="how-it-works"
                className="px-5 py-2 hover:text-white transition-colors duration-300"
              >
                Methodology
              </Link>
              <Link
                href="#pricing"
                data-id="pricing"
                className="px-5 py-2 hover:text-white transition-colors duration-300"
              >
                Pricing
              </Link>
            </AnimatedBackground>
          </div>
          <Link href="/dashboard">
            <InteractiveHoverButton className="px-7 py-3 text-sm">
              Enter Dashboard
            </InteractiveHoverButton>
          </Link>
        </div>
      </motion.nav>

      {/* ── HERO ────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-40 pb-0 overflow-hidden">
        <GradientBackground />

        {/* Interactive grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: isSplashComplete ? 1 : 0 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 z-0 pointer-events-auto overflow-hidden"
        >
          <InteractiveGridPattern
            className={cn(
              "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
            )}
          />
          {/* Vignette overlay to fade out the grid without breaking mouse events */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#000000_80%)] pointer-events-none" />
        </motion.div>

        <div className="relative z-10 max-w-6xl mx-auto w-full text-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-12"
          >
            <span className="inline-flex items-center gap-3 border border-white/[0.05] px-8 py-4 text-lg font-bold font-mono text-white/60 uppercase tracking-[0.2em] bg-white/[0.01] backdrop-blur-md">
              <TypingAnimation delay={500} duration={60} onComplete={() => setTimeout(() => setIsSplashComplete(true), 1500)}>
                YOUR SENIOR ENGINEER JUST QUIT.
              </TypingAnimation>
            </span>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={isSplashComplete ? "show" : "hidden"}
          >

          <div className="font-serif text-6xl md:text-8xl lg:text-9xl font-normal tracking-tighter mb-10 leading-none">
            <div className="text-white block">
              <TextEffect trigger={isSplashComplete} preset="fade-in-blur" speedReveal={1.1} speedSegment={0.3} className="inline-block">
                who knows
              </TextEffect>
              <span className="inline-block mx-[0.3em]">
                <motion.span 
                  initial={{ filter: "blur(10px)", opacity: 0, y: 5 }} 
                  animate={isSplashComplete ? { filter: "blur(0px)", opacity: 1, y: 0 } : {}} 
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="inline-block font-['Arial'] text-[#0052ff] italic font-bold"
                >
                  WHY
                </motion.span>
              </span>
              <TextEffect trigger={isSplashComplete} preset="fade-in-blur" speedReveal={1.1} speedSegment={0.3} delay={0.4} className="inline-block">
                those
              </TextEffect>
            </div>
            <TextEffect trigger={isSplashComplete} preset="fade-in-blur" speedReveal={1.1} speedSegment={0.3} delay={0.3} className="text-white/60 block mt-2">
              decisions were made?
            </TextEffect>
          </div>

          <div className="text-xl md:text-2xl text-white/30 font-light mb-14 max-w-3xl mx-auto leading-relaxed text-center">
            <TextEffect trigger={isSplashComplete} preset="fade-in-blur" speedReveal={1.1} speedSegment={0.3} delay={0.6} className="inline">
              Lore watches every PR, reads every Jira ticket, and listens to every Slack thread — then remembers its
            </TextEffect>
            <span className="inline-block mx-1.5">
              <motion.span 
                initial={{ filter: "blur(10px)", opacity: 0, y: 5 }} 
                animate={isSplashComplete ? { filter: "blur(0px)", opacity: 1, y: 0 } : {}} 
                transition={{ duration: 0.8, delay: 0.8 }}
                className="inline-block font-bold text-[#0052ff]"
              >
                INTENT
              </motion.span>
            </span>
            <TextEffect trigger={isSplashComplete} preset="fade-in-blur" speedReveal={1.1} speedSegment={0.3} delay={0.9} className="inline">
              forever.
            </TextEffect>
          </div>

          <motion.div
            variants={staggerItem}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12 pointer-events-auto"
          >
            <Link href="/dashboard">
              <InteractiveHoverButton className="px-10 py-5 text-lg">
                Experience Lore
              </InteractiveHoverButton>
            </Link>
            <a
              href="https://github.com/tarot-club-hackathons/lore"
              target="_blank"
              rel="noreferrer"
              className="px-10 py-5 bg-transparent border border-white/[0.1] text-white font-medium text-lg hover:bg-white/[0.03] hover:border-white/[0.2] transition-all duration-300 flex items-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
              </svg>
              View on GitHub
            </a>
          </motion.div>

          <motion.div variants={staggerItem} className="w-full relative z-20">
            <DashboardMockup />
          </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#161616] to-transparent pointer-events-none z-30" />
      </section>

      {/* ── MARQUEE ─────────────────────────── */}
      <MarqueeStrip />

      {/* ── PROBLEM ─────────────────────────── */}
      <section className="relative py-48 px-6 bg-[#F4F0EA] overflow-hidden border-t border-black/10">
        <GradientBackground />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <Label text="The Problem" />
          <h2 className="font-serif text-6xl md:text-8xl lg:text-9xl font-normal tracking-tighter mb-12 text-black leading-none">
            Every team has this <HyperText delay={200}>problem.</HyperText>
            <br />
            <span className="text-black/40">Nobody talks about it.</span>
          </h2>
          <p className="text-xl md:text-2xl text-black/60 font-light leading-relaxed mb-12 max-w-4xl mx-auto">
            Three months after the decision, nobody remembers <span className={cn(playfair.className, "italic", "font-bold")}>WHY</span>. A new
            developer re-introduces the library you banned last quarter. Your
            tech lead leaves and takes six months of <span className="font-bold">context</span> with them. You
            spend a Friday afternoon re-litigating a choice you already made in
            March.
          </p>
          <p className="text-2xl font-medium text-black/80">
            This is not a documentation problem. Documentation rots.
            <br />
            This is a memory problem.
          </p>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ────────────────────── */}
      <section
        id="how-it-works"
        className="relative pt-48 pb-0 px-6 md:px-[9rem] bg-[#F4F0EA] overflow-hidden border-t border-black/10"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:100%_120px] pointer-events-none" />

        <div className="w-full relative z-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="mb-24 text-center"
          >
            <Label text="How It Works" />
            <h2 className="font-serif text-6xl md:text-8xl lg:text-9xl font-normal tracking-tighter mb-8 text-black leading-none">
              Lore works while you work.
            </h2>
            <p className="text-xl md:text-2xl text-black/60 font-light max-w-3xl mx-auto">
              No process changes. No documentation sprints. No Notion pages
              nobody reads.
            </p>
          </motion.div>

          <div className="w-full border-t border-black/20 grid grid-cols-1 md:grid-cols-4 bg-[#F4F0EA]">
            {[
              {
                step: "01",
                title: "A PR gets merged",
                desc: "Lore wakes up. It reads the code diff, fetches the Jira ticket, and pulls the Slack thread your team had about it.",
              },
              {
                step: "02",
                title: "The AI extracts",
                desc: "Lore identifies what was decided, why it was decided, and who drove it — automatically.",
              },
              {
                step: "03",
                title: "It lives in the graph",
                desc: "The decision is stored in a knowledge graph. Connected to the people, the tools, and the code it touches.",
              },
              {
                step: "04",
                title: "Instant answers",
                desc: "'Why are we not using Redis anymore?' Lore answers in seconds, with the exact reason and who made the call.",
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.9,
                  delay: i * 0.15,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
                className={`relative bg-transparent p-10 hover:bg-black/[0.02] transition-colors duration-500 group border-b border-black/20 ${i !== 3 ? 'md:border-r' : ''}`}
              >
                <p className="text-xs font-mono text-[#0052ff]/60 uppercase tracking-widest mb-6">
                  {s.step}
                </p>
                <div className="w-px h-12 bg-gradient-to-b from-[#0052ff]/30 to-transparent mb-8" />
                <h3 className="text-4xl font-medium text-black/90 mb-4 tracking-tight">
                  {s.title}
                </h3>
                <p className="text-2xl text-black/60 font-light leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────── */}
      <section
        id="features"
        className="relative py-24 w-full bg-[#161616] border-t border-white/20"
      >
        <GradientBackground />

        {/* Title container keeps its max-w */}
        <div className="max-w-7xl mx-auto relative z-10 px-6 mb-24">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center max-w-4xl mx-auto"
          >
            <Label text="Features" />
            <h2 className="font-serif text-6xl md:text-8xl lg:text-9xl font-normal tracking-tighter text-white leading-none">
              Four ways Lore protects your team's memory.
            </h2>
          </motion.div>
        </div>

        {/* FeatureSkyline stretches to the grid lines (9rem on large screens) */}
        <div className="relative z-10 px-4 md:px-8 lg:px-[9rem]">
          <FeatureSkyline />
        </div>
      </section>

      {/* ── PERSON LEFT ─────────────────────── */}
      <section className="relative py-48 px-6 bg-[#161616] overflow-hidden border-t border-white/20">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-48 bg-gradient-to-b from-transparent via-[#0052ff]/40 to-transparent" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-48 bg-gradient-to-b from-transparent via-[#0052ff]/40 to-transparent" />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <Label text="Institutional Memory" />
          <h2 className="font-serif text-6xl md:text-8xl lg:text-9xl font-normal tracking-tighter mb-12 text-white leading-none">
            The most expensive knowledge is the kind you don't know you've lost.
          </h2>
          <p className="text-xl md:text-2xl text-white/30 font-light leading-relaxed max-w-4xl mx-auto">
            When a team member leaves, their decisions don't leave with them in
            Lore. Every choice they championed, every trade-off they made, every
            system only they understood — it stays in the graph. Their knowledge
            keeps protecting your codebase long after their last day.
          </p>
        </motion.div>
      </section>

      {/* ── STATS ───────────────────────────── */}
      <section className="relative py-40 px-6 bg-[#F4F0EA] border-y border-black/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          {[
            {
              value: 847,
              suffix: "",
              label: "Decisions captured in the first week of teams using Lore",
            },
            {
              value: 12,
              suffix: "min",
              label:
                "Average time before a PR Blocker would have caught the conflict",
            },
            {
              value: 1,
              suffix: "",
              label: "Command to ask why any decision was ever made",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="font-serif text-8xl md:text-9xl font-normal text-black mb-6 tabular-nums tracking-tighter">
                <CountUpNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-base text-black/60 font-light leading-relaxed max-w-[240px] mx-auto">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRICING ─────────────────────────── */}
      <section
        id="pricing"
        className="relative py-24 md:px-[9rem] bg-[#F4F0EA] border-t border-black/10"
      >
        <div className="w-full grid grid-cols-1 xl:grid-cols-5 bg-[#F4F0EA]">
          {/* Left Column */}
          <div className="xl:col-span-2 p-12 lg:p-16 border-b xl:border-b-0 xl:border-r border-black/20 flex flex-col justify-between">
            <div>
              <Label text="Pricing" />
              <h2 className="font-serif text-5xl lg:text-7xl font-normal tracking-tighter mb-8 text-black leading-none mt-8">
                Start free.
                <br />
                Scale when your team does.
              </h2>
              <p className="text-xl text-black/60 font-light leading-relaxed mb-12 max-w-sm">
                Free for solo engineers and open-source projects. Team plans
                with Slack integration and unlimited history starting at $15.
              </p>
            </div>
          </div>

          {/* Right Cards */}
          <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3">
            {/* Free Tier */}
            <div className="flex flex-col border-b md:border-b-0 md:border-r border-black/20">
              <div className="p-10 lg:p-12 flex-1">
                <h3 className="text-sm font-mono text-black/40 uppercase tracking-widest mb-4">
                  Free
                </h3>
                <div className="text-6xl font-light tracking-tighter text-black mb-8">
                  $0
                </div>
                <ul className="flex flex-col">
                  <li className="py-4 border-t border-black/20 text-black/70 text-sm">
                    Unlimited public repositories
                  </li>
                  <li className="py-4 border-t border-black/20 text-black/70 text-sm">
                    1 member per team
                  </li>
                  <li className="py-4 border-t border-black/20 text-black/70 text-sm">
                    30-day decision history
                  </li>
                  <li className="py-4 border-t border-black/20 text-black/70 text-sm">
                    Community support
                  </li>
                </ul>
              </div>
              <div className="p-8 border-t border-black/20">
                <button className="w-full py-4 bg-transparent border border-black/20 text-black hover:bg-black/5 transition-colors font-medium">
                  Start Free ↗
                </button>
              </div>
            </div>

            {/* Cloud Pro Tier */}
            <div className="flex flex-col bg-[#161616] border-b md:border-b-0 md:border-r border-[#161616]">
              <div className="p-10 lg:p-12 flex-1">
                <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-4">
                  Cloud Pro
                </h3>
                <div className="text-6xl font-light tracking-tighter text-white mb-2">
                  $15
                </div>
                <div className="text-sm text-white/40 mb-8">/ dev / month</div>
                <ul className="flex flex-col">
                  <li className="py-4 border-t border-white/10 text-white/70 text-sm">
                    Everything in Free
                  </li>
                  <li className="py-4 border-t border-white/10 text-white/70 text-sm">
                    Unlimited private repositories
                  </li>
                  <li className="py-4 border-t border-white/10 text-white/70 text-sm">
                    Slack & Jira integration
                  </li>
                  <li className="py-4 border-t border-white/10 text-white/70 text-sm">
                    Priority support
                  </li>
                </ul>
              </div>
              <div className="p-8 border-t border-white/10">
                <button className="w-full py-4 bg-white text-black hover:bg-white/90 transition-colors font-medium">
                  Start Trial ↗
                </button>
              </div>
            </div>

            {/* Enterprise Tier */}
            <div className="flex flex-col bg-[#F4F0EA]">
              <div className="p-10 lg:p-12 flex-1">
                <h3 className="text-sm font-mono text-black/40 uppercase tracking-widest mb-4">
                  Enterprise
                </h3>
                <div className="text-6xl font-light tracking-tighter text-black mb-8">
                  Custom
                </div>
                <ul className="flex flex-col">
                  <li className="py-4 border-t border-black/20 text-black/70 text-sm">
                    Everything in Pro
                  </li>
                  <li className="py-4 border-t border-black/20 text-black/70 text-sm">
                    Self-hosted deployments
                  </li>
                  <li className="py-4 border-t border-black/20 text-black/70 text-sm">
                    Custom LLM integration
                  </li>
                  <li className="py-4 border-t border-black/20 text-black/70 text-sm">
                    SLA & dedicated manager
                  </li>
                </ul>
              </div>
              <div className="p-8 border-t border-black/20">
                <button className="w-full py-4 bg-black text-white hover:bg-black/90 transition-colors font-medium">
                  Call us ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────── */}
      <section className="relative py-48 px-6 bg-[#F4F0EA] overflow-hidden border-t border-black/10">
        <GradientBackground />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0052ff]/20 to-transparent" />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <h2 className="font-serif text-7xl md:text-8xl lg:text-9xl font-normal tracking-tighter mb-12 leading-none text-black">
            Roadmap & Impact
          </h2>
          <p className="text-2xl text-black/60 font-light leading-relaxed mb-16 max-w-4xl mx-auto">
            We are expanding Lore's memory across your entire organization. Coming next: an intelligent team onboarding assistant, org-wide decision search, and seamless synchronization with Confluence and Notion.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/dashboard">
              <button className="px-12 py-6 bg-black text-white font-semibold text-xl hover:scale-105 transition-all duration-300 shadow-[0_0_60px_rgba(0,0,0,0.1)]">
                Enter Dashboard
              </button>
            </Link>
            <a
              href="https://github.com/tarot-club-hackathons/lore"
              target="_blank"
              rel="noreferrer"
              className="px-12 py-6 bg-transparent border border-black/20 text-black font-medium text-xl hover:bg-black/5 hover:border-black/30 transition-all duration-300"
            >
              View Repository
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ──────────────────────────── */}
      <MinimalFooter />
    </div>
  );
}
