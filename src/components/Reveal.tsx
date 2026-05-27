import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay (ms) before the reveal animation starts. Use for stagger. */
  delay?: number;
  /** Initial translate distance in pixels. Default 24. */
  offset?: number;
  /** IntersectionObserver root margin. */
  rootMargin?: string;
  /** Threshold of visibility before triggering. 0–1. Default 0.15. */
  threshold?: number;
  /** Duration of the reveal transition in ms. Default 700. */
  duration?: number;
}

const Reveal = ({
  children,
  className = "",
  delay = 0,
  offset = 24,
  rootMargin = "0px 0px -10% 0px",
  threshold = 0.15,
  duration = 700,
}: RevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div
      ref={ref}
      style={{
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${offset}px)`,
        willChange: "opacity, transform",
      }}
      className={className}
    >
      {children}
    </div>
  );
};

export default Reveal;
