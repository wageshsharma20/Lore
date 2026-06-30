"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

interface HyperTextProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
}

export function HyperText({
  children,
  className,
  duration = 800,
  delay = 0,
}: HyperTextProps) {
  const [displayText, setDisplayText] = useState(children);
  const [isHovered, setIsHovered] = useState(false);
  const iteration = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const startAnimation = () => {
    iteration.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText((currentText) => {
        return children
          .split("")
          .map((letter, index) => {
            if (index < iteration.current) {
              return children[index];
            }
            if (letter === " ") return " ";
            return alphabets[Math.floor(Math.random() * alphabets.length)];
          })
          .join("");
      });

      iteration.current += children.length / (duration / 16);

      if (iteration.current >= children.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(children);
      }
    }, 16);
  };

  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => {
        startAnimation();
      }, delay);
      return () => {
        clearTimeout(t);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [children, delay, duration, isInView]);

  useEffect(() => {
    if (isHovered) {
      startAnimation();
    }
  }, [isHovered]);

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {displayText}
    </motion.span>
  );
}
