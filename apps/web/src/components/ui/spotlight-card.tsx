"use client";

import { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(255, 255, 255, 0.15)",
  ...props
}: SpotlightCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        "group relative h-full rounded-2xl border border-white/10 bg-black/40 overflow-hidden",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent p-6 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
