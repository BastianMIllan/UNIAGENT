"use client";

import { useEffect, useRef } from "react";

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const chars = "UNIAGENT01アイウエオカキクケコ$¥€£USDC→←↑↓◆◇○●";
    const fontSize = 14;
    let columns: number;
    let drops: number[];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      columns = Math.floor(canvas!.width / fontSize);
      drops = Array.from({ length: columns }, () =>
        Math.random() * -100
      );
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx!.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Lead character is bright green
        ctx!.fillStyle = "#00ff41";
        ctx!.font = `${fontSize}px 'JetBrains Mono', monospace`;
        ctx!.fillText(char, x, y);

        // Trail character slightly dimmer
        if (drops[i] > 1) {
          ctx!.fillStyle = "rgba(0, 255, 65, 0.3)";
          ctx!.fillText(
            chars[Math.floor(Math.random() * chars.length)],
            x,
            (drops[i] - 1) * fontSize
          );
        }

        if (y > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5 + Math.random() * 0.5;
      }
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 opacity-40 pointer-events-none"
    />
  );
}
