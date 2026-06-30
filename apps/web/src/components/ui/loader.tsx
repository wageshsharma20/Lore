import React from "react";
import { motion } from "framer-motion";

export function LoaderFour() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-6">
      <motion.div
        className="w-16 h-16 border border-black/10 relative bg-[#F4F0EA]"
        initial={{ rotate: 0 }}
        animate={{ rotate: 90 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <motion.div
          className="absolute inset-0 bg-black origin-bottom"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: [0, 1, 1, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.3, 0.7, 1],
          }}
        />
      </motion.div>
      <div className="font-mono text-xs text-black/40 uppercase tracking-widest">
        Loading...
      </div>
    </div>
  );
}
