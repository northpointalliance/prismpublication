import { useEffect, useRef } from "react";

type GradientStop = { pos: number; rgb: [number, number, number] };

interface Props {
  spacing?: number;
  mouseRadius?: number;
  baseAlpha?: number;
  hotAlpha?: number;
  stops?: GradientStop[];
  className?: string;
  fixed?: boolean;
}

// Default rainbow: dark blue → light blue → green → yellow → orange → red.
const DEFAULT_STOPS: GradientStop[] = [
  { pos: 0.0, rgb: [30, 58, 138] },    // dark blue (blue-900)
  { pos: 0.2, rgb: [56, 189, 248] },   // light blue (sky-400)
  { pos: 0.4, rgb: [34, 197, 94] },    // green (green-500)
  { pos: 0.6, rgb: [250, 204, 21] },   // yellow (yellow-400)
  { pos: 0.8, rgb: [249, 115, 22] },   // orange (orange-500)
  { pos: 1.0, rgb: [239, 68, 68] },    // red (red-500)
];

const MouseGrid = ({
  spacing = 38,
  mouseRadius = 160,
  baseAlpha = 0.22,
  hotAlpha = 0.95,
  stops = DEFAULT_STOPS,
  className = "",
  fixed = false,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Sort stops ascending so the lookup below is correct.
    const sortedStops = [...stops].sort((a, b) => a.pos - b.pos);

    const colorAt = (nx: number): [number, number, number] => {
      if (nx <= sortedStops[0].pos) return sortedStops[0].rgb;
      if (nx >= sortedStops[sortedStops.length - 1].pos) return sortedStops[sortedStops.length - 1].rgb;
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const a = sortedStops[i];
        const b = sortedStops[i + 1];
        if (nx >= a.pos && nx <= b.pos) {
          const t = (nx - a.pos) / (b.pos - a.pos);
          return [
            Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t),
            Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t),
            Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t),
          ];
        }
      }
      return sortedStops[sortedStops.length - 1].rgb;
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const drawStatic = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);
        for (let x = spacing / 2; x < rect.width; x += spacing) {
          const [r, g, b] = colorAt(x / rect.width);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${baseAlpha})`;
          for (let y = spacing / 2; y < rect.height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      };
      drawStatic();
      return;
    }

    const isTouchOnly = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let running = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / spacing);
      rows = Math.ceil(height / spacing);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = mouse.x >= 0 && mouse.x <= width && mouse.y >= 0 && mouse.y <= height;
    };

    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) loop();
    };

    const mouseRadiusSq = mouseRadius * mouseRadius;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i <= cols; i++) {
        const baseX = i * spacing + spacing / 2;
        const nx = baseX / width;
        const [r, g, b] = colorAt(nx);

        for (let j = 0; j <= rows; j++) {
          const baseY = j * spacing + spacing / 2;

          let alpha = baseAlpha;
          let radius = 2;
          let x = baseX;
          let y = baseY;

          if (mouse.active) {
            const dx = baseX - mouse.x;
            const dy = baseY - mouse.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < mouseRadiusSq) {
              const t = 1 - distSq / mouseRadiusSq;
              alpha = baseAlpha + (hotAlpha - baseAlpha) * t;
              radius = 2 + 0.5 * t;
              const dist = Math.sqrt(distSq);
              if (dist > 0.001) {
                const push = t * 6;
                x = baseX + (dx / dist) * push;
                y = baseY + (dy / dist) * push;
              }
            }
          }

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = () => {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    };

    resize();
    loop();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (!isTouchOnly) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [spacing, mouseRadius, baseAlpha, hotAlpha, stops]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 h-full w-full ${className}`}
    />
  );
};

export default MouseGrid;
