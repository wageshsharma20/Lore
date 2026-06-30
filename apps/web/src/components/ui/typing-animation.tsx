"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}

export function TypingAnimation({
  children,
  className,
  duration = 50,
  delay = 0,
  onComplete,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
        if (onComplete) {
          onComplete();
        }
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [children, duration, started]);

  return (
    <span className={cn(className)}>
      {displayedText}
      {/* Optional blinking cursor */}
      <span className="animate-[pulse_1s_infinite] ml-1 opacity-50">_</span>
    </span>
  );
}
