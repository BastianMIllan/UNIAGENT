"use client";

import { useState, useEffect } from "react";

interface Props {
  texts: string[];
  speed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
  className?: string;
}

export default function TypeWriter({
  texts,
  speed = 60,
  deleteSpeed = 30,
  pauseMs = 2000,
  className = "",
}: Props) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];

    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => {
        setDisplay(current.slice(0, charIdx + 1));
        setCharIdx(charIdx + 1);
      }, speed);
      return () => clearTimeout(t);
    }

    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pauseMs);
      return () => clearTimeout(t);
    }

    if (deleting && charIdx > 0) {
      const t = setTimeout(() => {
        setDisplay(current.slice(0, charIdx - 1));
        setCharIdx(charIdx - 1);
      }, deleteSpeed);
      return () => clearTimeout(t);
    }

    if (deleting && charIdx === 0) {
      const t = setTimeout(() => {
        setDeleting(false);
        setIdx((idx + 1) % texts.length);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [charIdx, deleting, idx, texts, speed, deleteSpeed, pauseMs]);

  return (
    <span className={className}>
      {display}
      <span className="animate-pulse text-green">|</span>
    </span>
  );
}
