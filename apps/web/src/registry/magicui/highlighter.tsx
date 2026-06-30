import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HighlighterProps {
  children: React.ReactNode;
  className?: string;
  action?: "highlight" | "underline";
  color?: string;
}

export function Highlighter({
  children,
  className,
  action = "highlight",
  color = "#87CEFA",
}: HighlighterProps) {
  return (
    <span className={cn("relative inline-block z-10", className)}>
      {children}
      <motion.span
        initial={{ width: "0%" }}
        whileInView={{ width: "100%" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className={cn(
          "absolute left-0 bottom-0 z-[-1]",
          action === "highlight" ? "h-[60%] opacity-40 rounded-sm" : "h-[4px] rounded-full"
        )}
        style={{
          backgroundColor: color,
        }}
      />
    </span>
  );
}
