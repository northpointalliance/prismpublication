import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const ScrollVideoSection = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);

  // Force autoplay on mount + whenever the section becomes visible.
  // React sometimes drops the muted attribute on first render and Chrome's
  // autoplay policy needs muted=true at the moment .play() is called.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = true;
    v.defaultMuted = true;
    const tryPlay = () => v.play().catch(() => undefined);
    tryPlay();

    // Retry on canplay, in case the network is slow on first paint.
    v.addEventListener("canplay", tryPlay, { once: true });
    v.addEventListener("loadedmetadata", tryPlay, { once: true });

    // Also retry whenever the section scrolls into view.
    const section = sectionRef.current;
    let observer: IntersectionObserver | null = null;
    if (section) {
      observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) tryPlay(); },
        { threshold: 0.05 },
      );
      observer.observe(section);
    }

    return () => {
      v.removeEventListener("canplay", tryPlay);
      v.removeEventListener("loadedmetadata", tryPlay);
      observer?.disconnect();
    };
  }, []);

  // Grow the video as the section moves through the viewport
  useEffect(() => {
    const section = sectionRef.current;
    const wrapper = wrapperRef.current;
    if (!section || !wrapper) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wrapper.style.transform = "scale(1)";
      wrapper.style.opacity = "1";
      return;
    }

    let raf = 0;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;

      // Growth zone: starts as soon as the section appears at the bottom of
      // the viewport and finishes only when its top reaches ~10% from the top.
      // That gives ~90% of a viewport-height of scroll to grow into place.
      const start = vh;
      const end = vh * 0.1;
      const raw = (start - rect.top) / (start - end);
      const progress = Math.min(1, Math.max(0, raw));

      // Ease-out cubic for a smooth landing.
      const eased = 1 - Math.pow(1 - progress, 3);

      const scale = 0.35 + 0.65 * eased;
      const opacity = 0.15 + 0.85 * eased;

      wrapper.style.transform = `scale(${scale.toFixed(3)})`;
      wrapper.style.opacity = opacity.toFixed(3);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next) {
      v.volume = 1;
      v.play().catch(() => undefined);
    }
    setMuted(next);
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="scroll-video-heading"
      className="relative py-32"
    >
      <h2 id="scroll-video-heading" className="sr-only">Product walkthrough</h2>

      <div className="container mx-auto px-6">
        <div
          ref={wrapperRef}
          className="mx-auto max-w-7xl will-change-transform"
          style={{ transform: "scale(0.35)", opacity: 0.15, transformOrigin: "center" }}
        >
          <div className="relative">
            {/* Soft glow behind */}
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 blur-2xl" aria-hidden="true" />

            <div className="relative overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-2xl">
              <video
                ref={videoRef}
                className="block h-auto w-full"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster="/media/hero-video-poster.jpg"
                aria-label="Prism product walkthrough"
              >
                <source src="/media/hero-video.webm" type="video/webm" />
                <source src="/media/hero-video-web.mp4" type="video/mp4" />
              </video>

              {/* Cover "Launching Soon" text baked into the video */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="rounded-full bg-primary/90 px-5 py-2 text-sm font-semibold tracking-wide text-white shadow-lg backdrop-blur-sm">
                  Now Live
                </span>
              {/* "Now Live" Badge Overlay */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500/90 to-emerald-500/90 px-4 py-2 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-sm font-semibold text-white">Now Live</span>
              </div>

              <button
                type="button"
                onClick={toggleSound}
                aria-label={muted ? "Unmute video" : "Mute video"}
                aria-pressed={!muted}
                className="absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110"
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollVideoSection;
