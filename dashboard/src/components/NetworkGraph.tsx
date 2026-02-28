"use client";

import { useEffect, useRef } from "react";

const CHAINS = [
  { name: "Ethereum", x: 50, y: 30 },
  { name: "Arbitrum", x: 25, y: 50 },
  { name: "Optimism", x: 75, y: 50 },
  { name: "Base", x: 35, y: 75 },
  { name: "Polygon", x: 65, y: 75 },
  { name: "BSC", x: 15, y: 25 },
  { name: "Avalanche", x: 85, y: 25 },
  { name: "Solana", x: 50, y: 90 },
  { name: "Scroll", x: 10, y: 65 },
  { name: "zkSync", x: 90, y: 65 },
];

const CONNECTIONS = [
  [0, 1], [0, 2], [0, 5], [0, 6], [1, 3], [2, 4],
  [3, 7], [4, 7], [1, 8], [2, 9], [5, 8], [6, 9],
];

interface Particle {
  from: number;
  to: number;
  progress: number;
  speed: number;
}

export default function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];

    function resize() {
      canvas!.width = canvas!.offsetWidth * 2;
      canvas!.height = canvas!.offsetHeight * 2;
      ctx!.scale(2, 2);
    }
    resize();
    window.addEventListener("resize", resize);

    // Spawn particles randomly
    function spawnParticle() {
      const conn = CONNECTIONS[Math.floor(Math.random() * CONNECTIONS.length)];
      particles.push({
        from: conn[0],
        to: conn[1],
        progress: 0,
        speed: 0.003 + Math.random() * 0.005,
      });
    }

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      const nodes = CHAINS.map((c) => ({
        ...c,
        px: (c.x / 100) * w,
        py: (c.y / 100) * h,
      }));

      // Draw connections
      for (const [a, b] of CONNECTIONS) {
        ctx!.beginPath();
        ctx!.moveTo(nodes[a].px, nodes[a].py);
        ctx!.lineTo(nodes[b].px, nodes[b].py);
        ctx!.strokeStyle = "rgba(0, 255, 65, 0.08)";
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          particles.splice(i, 1);
          continue;
        }
        const fromN = nodes[p.from];
        const toN = nodes[p.to];
        const px = fromN.px + (toN.px - fromN.px) * p.progress;
        const py = fromN.py + (toN.py - fromN.py) * p.progress;

        ctx!.beginPath();
        ctx!.arc(px, py, 2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0, 255, 65, ${0.8 - p.progress * 0.5})`;
        ctx!.fill();

        // Glow
        ctx!.beginPath();
        ctx!.arc(px, py, 6, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0, 255, 65, ${0.15 - p.progress * 0.1})`;
        ctx!.fill();
      }

      // Draw nodes
      for (const n of nodes) {
        // Outer ring
        ctx!.beginPath();
        ctx!.arc(n.px, n.py, 8, 0, Math.PI * 2);
        ctx!.strokeStyle = "rgba(0, 255, 65, 0.3)";
        ctx!.lineWidth = 1;
        ctx!.stroke();

        // Inner dot
        ctx!.beginPath();
        ctx!.arc(n.px, n.py, 3, 0, Math.PI * 2);
        ctx!.fillStyle = "#00ff41";
        ctx!.fill();

        // Label
        ctx!.font = "9px monospace";
        ctx!.fillStyle = "rgba(255,255,255,0.4)";
        ctx!.textAlign = "center";
        ctx!.fillText(n.name, n.px, n.py + 18);
      }

      // Randomly spawn
      if (Math.random() > 0.95) spawnParticle();

      animId = requestAnimationFrame(draw);
    }

    // Initial particles
    for (let i = 0; i < 5; i++) spawnParticle();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: "auto" }}
    />
  );
}
