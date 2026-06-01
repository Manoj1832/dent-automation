"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  glowColor?: string;
}

export function AnimatedCard({
  children,
  delay = 0,
  className,
  glowColor = "rgba(16, 185, 129, 0.15)", // emerald glow default
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ y: -5 }}
      className="relative group h-full"
      {...props as any}
    >
      <div
        className="absolute -inset-0.5 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundColor: glowColor }}
      />
      <div
        className={cn(
          "relative h-full w-full rounded-2xl border border-white/5 bg-background/50 backdrop-blur-xl p-6 shadow-2xl transition-colors duration-500 hover:border-white/10 overflow-hidden",
          className
        )}
      >
        {/* Subtle glass reflection */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        <div className="relative z-10">{children}</div>
      </div>
    </motion.div>
  );
}
