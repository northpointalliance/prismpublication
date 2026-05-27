import { Fragment, useEffect, useState } from "react";

export interface TypewriterSegment {
  text: string;
  className?: string;
  /** Insert a <br /> after this segment when its characters are fully revealed. */
  breakAfter?: boolean;
}

interface Props {
  segments: TypewriterSegment[];
  /** Milliseconds between characters. Default 40. */
  speedMs?: number;
  /** Milliseconds to wait before typing starts. Default 200. */
  startDelayMs?: number;
  /** Show the blinking cursor after typing finishes. Default true. */
  keepCursor?: boolean;
}

const Typewriter = ({ segments, speedMs = 40, startDelayMs = 200, keepCursor = true }: Props) => {
  const totalLength = segments.reduce((sum, seg) => sum + seg.text.length, 0);
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(totalLength);
      setDone(true);
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setShown((prev) => {
          if (prev >= totalLength) {
            if (interval) clearInterval(interval);
            setDone(true);
            return prev;
          }
          return prev + 1;
        });
      }, speedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [totalLength, speedMs, startDelayMs]);

  let remaining = shown;
  return (
    <>
      {segments.map((seg, i) => {
        const charsToShow = Math.max(0, Math.min(seg.text.length, remaining));
        const shownText = seg.text.slice(0, charsToShow);
        remaining -= seg.text.length;
        const showBreak = seg.breakAfter && charsToShow === seg.text.length;
        return (
          <Fragment key={i}>
            <span className={seg.className}>{shownText}</span>
            {showBreak && <br />}
          </Fragment>
        );
      })}
      {(!done || keepCursor) && (
        <span
          aria-hidden="true"
          className="inline-block align-baseline ml-1 w-[0.07em] h-[0.85em] rounded-[1px] bg-gradient-rainbow animate-typewriter-blink"
          style={{ verticalAlign: "-0.05em" }}
        />
      )}
    </>
  );
};

export default Typewriter;
