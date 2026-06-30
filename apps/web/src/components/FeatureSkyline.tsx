'use client';
 
import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useTransform, MotionValue } from "framer-motion";
 
const FEATURES = [
  {
    title: "Decision Memory",
    shortTitle: "Decision\nMemory",
    description: "Ask anything. \"Why did we choose Postgres?\" \"Who decided to remove Tailwind?\" Lore answers from the graph — with context, attribution, and the original PR link. Works in the dashboard and directly in Slack via @Lore.",
  },
  {
    title: "PR Blocker — The Guard",
    shortTitle: "PR\nBlocker",
    description: "When a new PR tries to re-introduce a banned library or reverse a past decision, Lore blocks the merge automatically. The comment explains exactly why — and names the person who made the original call.",
  },
  {
    title: "Knowledge Risk Heatmap",
    shortTitle: "Risk\nHeatmap",
    description: "A live map of your codebase showing where knowledge is dangerously concentrated. When only one person understands a critical system — and that person might leave — the tile turns red.",
  },
  {
    title: "ADR Generator",
    shortTitle: "ADR\nGenerator",
    description: "Every significant merge auto-generates a draft Architecture Decision Record. Review it, approve it, and Lore opens a PR with the ADR markdown committed to your repo. Your documentation writes itself.",
  },
];
 
const BUILDING_W = 120;
const BUILDING_D = 120;
const ACTIVE_HEIGHT = 550;

// Arrange 18 blocks in a single continuous line along the Z-axis.
const TOTAL_BLOCKS = 18;
const FEATURE_START = 7; // The 4 features will be blocks 7, 8, 9, 10
const BLOCKS = Array.from({ length: TOTAL_BLOCKS }).map((_, i) => ({
  x: i - Math.floor(TOTAL_BLOCKS / 2),
  z: 0,
  h: 160 + Math.abs(i - Math.floor(TOTAL_BLOCKS / 2)) * 15, // Creates a nice natural curve in base heights
  featureIndex: (i >= FEATURE_START && i < FEATURE_START + 4) ? i - FEATURE_START : undefined,
}));
 
function Building({
  block,
  scrollYProgress,
  totalFeatures,
}: {
  block: typeof BLOCKS[0];
  scrollYProgress: MotionValue<number>;
  totalFeatures: number;
}) {
  const isFeature = block.featureIndex !== undefined;
  const index = block.featureIndex ?? 0;

  // Distribute the 4 features equally across the 0-1 scroll progress.
  // Centers at 0.125, 0.375, 0.625, 0.875
  const center = (index + 0.5) / totalFeatures;
  const spread = 1 / totalFeatures; // 0.25 spread means smooth overlap

  // Generate 21 strictly monotonic points from 0.0 to 1.0 to prevent WAAPI out-of-bounds offset errors
  const xVals = Array.from({ length: 21 }).map((_, i) => i / 20);
  
  const hVals = xVals.map(x => {
    if (!isFeature) return block.h;
    const dist = Math.abs(x - center);
    if (dist >= spread) return block.h;
    const intensity = 1 - (dist / spread);
    return block.h + (ACTIVE_HEIGHT - block.h) * intensity;
  });

  const opVals = xVals.map(x => {
    if (!isFeature) return 0;
    const dist = Math.abs(x - center);
    if (dist >= spread) return 0;
    return 1 - (dist / spread);
  });

  // Scrub the height directly based on scroll
  const height = useTransform(scrollYProgress, xVals, hVals);

  // Scrub the active opacity directly based on scroll
  const activeOpacity = useTransform(scrollYProgress, xVals, opVals);

  const dimEdge = "rgba(255,255,255,0.15)";
  const baseBg = "#111111"; // Occludes blocks behind it

  return (
    <motion.div
      className="absolute bottom-0"
      style={{
        left: '50%',
        width: BUILDING_W,
        height,
        // The blocks are stacked perfectly side-by-side along the Z axis to form a solid wall
        transform: `translate3d(calc(-50% + ${block.x * BUILDING_W}px), 0, ${block.z * BUILDING_D}px)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* FRONT face - BASE */}
      <div
        className="absolute inset-0"
        style={{
          background: baseBg,
          border: `1px solid ${dimEdge}`,
          transform: `translateZ(${BUILDING_D / 2}px)`,
        }}
      />
      {/* FRONT face - ACTIVE */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "#0044d6",
          border: `1px solid rgba(255,255,255,0.4)`,
          transform: `translateZ(${BUILDING_D / 2}px)`,
          opacity: activeOpacity,
          boxShadow: `0 0 40px rgba(26, 94, 255, 0.4)`,
        }}
      />

      {/* RIGHT face - BASE */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          width: BUILDING_D,
          left: BUILDING_W - BUILDING_D / 2,
          background: baseBg,
          border: `1px solid ${dimEdge}`,
          transform: `rotateY(90deg)`,
        }}
      />
      {/* RIGHT face - ACTIVE */}
      <motion.div
        className="absolute top-0 bottom-0"
        style={{
          width: BUILDING_D,
          left: BUILDING_W - BUILDING_D / 2,
          background: "#0028a3",
          border: `1px solid rgba(255,255,255,0.3)`,
          transform: `rotateY(90deg)`,
          opacity: activeOpacity,
        }}
      />

      {/* TOP face - BASE */}
      <div
        className="absolute left-0"
        style={{
          width: BUILDING_W,
          height: BUILDING_D,
          top: -BUILDING_D / 2,
          background: baseBg,
          border: `1px solid ${dimEdge}`,
          transform: `rotateX(90deg)`,
        }}
      />
      {/* TOP face - ACTIVE */}
      <motion.div
        className="absolute left-0 flex items-center justify-center p-2"
        style={{
          width: BUILDING_W,
          height: BUILDING_D,
          top: -BUILDING_D / 2,
          background: "#1a5eff",
          border: `1px solid rgba(255,255,255,0.5)`,
          transform: `rotateX(90deg)`,
          opacity: activeOpacity,
        }}
      >
        {isFeature && (
          <div className="flex flex-col text-white w-full h-full justify-between items-start">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h6v2H8v-2z" />
            </svg>
            <span className="text-[12px] font-semibold leading-tight whitespace-pre-wrap">
              {FEATURES[index].shortTitle}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
 
export default function FeatureSkyline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Map latest (0 to 1) perfectly into 4 equal buckets
    let index = Math.floor(latest * FEATURES.length);
    if (index >= FEATURES.length) index = FEATURES.length - 1;
    if (index < 0) index = 0;
    
    if (index !== active) {
      setActive(index);
    }
  });
 
  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen flex flex-col justify-center py-20 overflow-hidden">
        
        <div className="w-full relative grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-0 border-y border-white/20 overflow-hidden h-[800px]">
          {/* ── LEFT: feature list ───────────────────── */}
          <div className="border-b lg:border-b-0 lg:border-r border-white/20 flex flex-col justify-center z-10 relative">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="w-full text-left px-12 py-10 relative group transition-colors duration-300"
              >
                {active === i && (
                  <motion.div
                    layoutId="activeFeatureBg"
                    className="absolute inset-0 bg-[#0052ff]/10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {active === i && (
                  <motion.span
                    layoutId="activeFeatureBar"
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0052ff]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span
                  className="block font-serif text-3xl md:text-4xl font-normal tracking-tight transition-colors duration-300 relative z-10"
                  style={{
                    color: active === i ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {f.title}
                </span>
              </div>
            ))}
          </div>
    
          {/* ── RIGHT: headline + 3D skyline scene ────── */}
          <div className="relative p-12 lg:p-20 min-h-[480px] flex flex-col overflow-hidden">
            <div className="mb-12 relative z-20">
              <span className="inline-flex items-center gap-2 border border-white/20 px-4 py-1.5 text-xs text-white/40 backdrop-blur-md font-mono uppercase tracking-widest">
                Scroll to explore
                <motion.svg 
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M12 5v14M19 12l-7 7-7-7"/>
                </motion.svg>
              </span>
            </div>
    
            <div className="relative z-20 max-w-md min-h-[160px]">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <h3 className="font-serif text-5xl md:text-6xl font-normal tracking-tighter text-white mb-6 drop-shadow-md">
                    {FEATURES[active].title}
                  </h3>
                  <p className="text-white/60 font-light leading-relaxed text-lg drop-shadow-md max-w-lg">
                    {FEATURES[active].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
    
            {/* 3D skyline scene */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ perspective: 2000 }}>
              <div
                className="absolute"
                style={{
                  transformStyle: "preserve-3d",
                  // rotateX(-70deg) pitches the camera DOWN from above (bird's-eye view).
                  // rotateY(-25deg) angles the line on the screen.
                  transform: "rotateX(-70deg) rotateY(-25deg)",
                  top: '80%',
                  left: '60%',
                }}
              >
                {BLOCKS.map((block, i) => (
                  <Building
                    key={i}
                    block={block}
                    totalFeatures={FEATURES.length}
                    scrollYProgress={scrollYProgress}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}