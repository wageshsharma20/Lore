'use client';
 
/* ═══════════════════════════════════════════════════════════
   BlueprintGrid
   A fixed, full-height vertical line grid that sits behind all
   page content — the doss.com "everything lives inside lines"
   structural overlay.
═══════════════════════════════════════════════════════════ */
 
export default function BlueprintGrid() {
  // 5 columns → 6 lines total (including outer edges).
  const COLS = 5;
  const lines = Array.from({ length: COLS + 1 }, (_, i) => i);
  const centerIndex = Math.floor(COLS / 2);
 
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] mix-blend-difference overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative w-full h-full opacity-20">
        
        {/* Left Side: Dotted line closer to edge, solid line further in, with an increased gap */}
        <div className="absolute top-0 bottom-0 w-px" style={{ left: '5rem', backgroundImage: "repeating-linear-gradient(to bottom, #ffffff 0px, #ffffff 8px, transparent 8px, transparent 16px)" }} />
        <div className="absolute top-0 bottom-0 w-px bg-white" style={{ left: '9rem' }} />

        {/* Right Side: Solid line further in, dotted line closer to edge */}
        <div className="absolute top-0 bottom-0 w-px bg-white" style={{ right: '9rem' }} />
        <div className="absolute top-0 bottom-0 w-px" style={{ right: '5rem', backgroundImage: "repeating-linear-gradient(to bottom, #ffffff 0px, #ffffff 8px, transparent 8px, transparent 16px)" }} />

      </div>
    </div>
  );
}