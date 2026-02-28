"use client";

import { motion } from "framer-motion";

interface Props {
  text: string;
  className?: string;
}

export default function GlitchText({ text, className = "" }: Props) {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      whileHover="glitch"
    >
      <span className="relative z-10">{text}</span>
      <motion.span
        className="absolute inset-0 text-cyan z-0"
        variants={{
          glitch: {
            x: [0, -2, 2, -1, 0],
            opacity: [0, 1, 1, 1, 0],
            transition: { duration: 0.3, repeat: Infinity },
          },
        }}
        aria-hidden
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute inset-0 text-(--red) z-0"
        variants={{
          glitch: {
            x: [0, 2, -2, 1, 0],
            opacity: [0, 1, 1, 1, 0],
            transition: { duration: 0.3, repeat: Infinity, delay: 0.05 },
          },
        }}
        aria-hidden
      >
        {text}
      </motion.span>
    </motion.span>
  );
}
