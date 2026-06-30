"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";

interface InteractiveGridPatternProps {
  className?: string;
  squaresClassName?: string;
  width?: number;
  height?: number;
  hoverColor?: string;
  gridColor?: string;
}

export function InteractiveGridPattern({
  className,
  squaresClassName,
  width = 100,
  height = 100,
  hoverColor = "rgba(255, 255, 255, 0.15)",
  gridColor = "rgba(255, 255, 255, 0.08)",
}: InteractiveGridPatternProps) {
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null);

  const cols = 50;
  const rows = 40;

  return (
    <svg
      width="100%"
      height="100%"
      className={cn("absolute inset-0 h-full w-full pointer-events-auto", className)}
      style={{ minWidth: cols * width, minHeight: rows * height }}
    >
      <defs>
        <pattern
          id="interactiveGrid"
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${width} 0 L 0 0 0 ${height}`}
            fill="transparent"
            stroke={gridColor}
            strokeWidth="1"
          />
        </pattern>
      </defs>

      {/* Background Grid Pattern */}
      <rect width="100%" height="100%" fill="url(#interactiveGrid)" />

      {/* Interactive Cells */}
      <svg x="0" y="0" className="overflow-visible">
        {Array.from({ length: cols * rows }).map((_, index) => {
          const x = (index % cols) * width;
          const y = Math.floor(index / cols) * height;
          const isHovered = hovered?.x === x && hovered?.y === y;

          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={width}
              height={height}
              fill={isHovered ? hoverColor : "transparent"}
              className={cn(
                "transition-colors duration-[1500ms] ease-out",
                squaresClassName
              )}
              style={{ transitionDuration: isHovered ? "0s" : "1500ms" }}
              onMouseEnter={() => setHovered({ x, y })}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>
    </svg>
  );
}
