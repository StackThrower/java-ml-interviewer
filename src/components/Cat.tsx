"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

export type CatState = "idle" | "thinking" | "speaking" | "listening";

interface Props {
  state: CatState;
  /** Written by the speech engine on every spoken word (set to 1); the cat decays it. */
  mouthPulse: MutableRefObject<number>;
}

const EYES = [
  { cx: 152, cy: 182 },
  { cx: 248, cy: 182 },
];

export default function Cat({ state, mouthPulse }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mouthRef = useRef<SVGGElement>(null);
  const pupilRefs = useRef<(SVGGElement | null)[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const pointer = useRef<{ x: number; y: number } | null>(null);

  // Track the cursor so the eyes can follow it.
  useEffect(() => {
    const onMove = (e: PointerEvent) => (pointer.current = { x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // One animation loop drives the mouth (lip-sync) and pupils without React re-renders.
  useEffect(() => {
    let raf = 0;
    let open = 0;
    const pupils = EYES.map(() => ({ x: 0, y: 0 }));

    const tick = (t: number) => {
      const s = stateRef.current;

      // --- mouth ---------------------------------------------------------
      let target = 0;
      if (s === "speaking") {
        const chatter = 0.35 + 0.35 * Math.abs(Math.sin(t / 55)) * (0.6 + 0.4 * Math.sin(t / 137));
        target = Math.max(chatter, mouthPulse.current);
        mouthPulse.current *= 0.88;
      } else {
        mouthPulse.current = 0;
      }
      open += (target - open) * 0.45;
      if (mouthRef.current) {
        mouthRef.current.style.transform = `scaleY(${open.toFixed(3)})`;
        mouthRef.current.style.opacity = open > 0.03 ? "1" : "0";
      }

      // --- pupils --------------------------------------------------------
      const svg = svgRef.current;
      if (svg) {
        const rect = svg.getBoundingClientRect();
        const scale = rect.width / 400;
        EYES.forEach((eye, i) => {
          let tx = 0;
          let ty = 0;
          if (s === "thinking") {
            tx = 7 + Math.sin(t / 400) * 2;
            ty = -9;
          } else if (pointer.current) {
            const ex = rect.left + eye.cx * scale;
            const ey = rect.top + eye.cy * scale;
            const dx = pointer.current.x - ex;
            const dy = pointer.current.y - ey;
            const d = Math.hypot(dx, dy) || 1;
            const m = Math.min(9, d / 25);
            tx = (dx / d) * m;
            ty = (dy / d) * m * 0.9;
          }
          pupils[i].x += (tx - pupils[i].x) * 0.15;
          pupils[i].y += (ty - pupils[i].y) * 0.15;
          const el = pupilRefs.current[i];
          if (el) el.setAttribute("transform", `translate(${pupils[i].x.toFixed(2)} ${pupils[i].y.toFixed(2)})`);
        });
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mouthPulse]);

  return (
    <div className={`cat cat--${state}`}>
      <svg ref={svgRef} viewBox="0 0 400 400" role="img" aria-label={`Whiskers the interviewer cat, ${state}`}>
        <defs>
          <radialGradient id="fur" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#ffc28a" />
            <stop offset="100%" stopColor="#f0954a" />
          </radialGradient>
          <radialGradient id="belly" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff3e6" />
            <stop offset="100%" stopColor="#ffe0c2" />
          </radialGradient>
        </defs>

        {/* shadow */}
        <ellipse cx="200" cy="392" rx="130" ry="8" fill="rgba(0,0,0,.25)" />

        {/* tail */}
        <g className="cat__tail">
          <path
            d="M300 360 C 370 350, 380 280, 350 240 C 335 220, 355 205, 368 222"
            fill="none"
            stroke="#f0954a"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path d="M352 236 C 340 222, 352 210, 366 220" fill="none" stroke="#c96d2a" strokeWidth="10" strokeLinecap="round" />
        </g>

        {/* body */}
        <g className="cat__body">
          <ellipse cx="200" cy="335" rx="112" ry="62" fill="url(#fur)" />
          <ellipse cx="200" cy="342" rx="62" ry="48" fill="url(#belly)" />
          <ellipse cx="150" cy="384" rx="30" ry="14" fill="#ffd7b0" />
          <ellipse cx="250" cy="384" rx="30" ry="14" fill="#ffd7b0" />
          <path d="M140 384 v-8 M150 386 v-9 M160 384 v-8 M240 384 v-8 M250 386 v-9 M260 384 v-8" stroke="#e9a877" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* head */}
        <g className="cat__head">
          {/* ears */}
          <g className="cat__ear cat__ear--left">
            <path d="M92 150 L104 40 L178 100 Z" fill="#f0954a" />
            <path d="M108 128 L114 68 L158 104 Z" fill="#ffb3c1" />
          </g>
          <g className="cat__ear cat__ear--right">
            <path d="M308 150 L296 40 L222 100 Z" fill="#f0954a" />
            <path d="M292 128 L286 68 L242 104 Z" fill="#ffb3c1" />
          </g>

          <ellipse cx="200" cy="195" rx="122" ry="104" fill="url(#fur)" />
          {/* stripes */}
          <path d="M200 96 v28 M178 100 l6 22 M222 100 l-6 22" stroke="#c96d2a" strokeWidth="7" strokeLinecap="round" />
          <path d="M80 190 h22 M82 206 h18 M320 190 h-22 M318 206 h-18" stroke="#c96d2a" strokeWidth="6" strokeLinecap="round" />
          {/* muzzle */}
          <ellipse cx="200" cy="240" rx="58" ry="40" fill="url(#belly)" />
          {/* cheeks */}
          <ellipse cx="118" cy="232" rx="18" ry="10" fill="#ff8fa3" opacity=".35" />
          <ellipse cx="282" cy="232" rx="18" ry="10" fill="#ff8fa3" opacity=".35" />

          {/* eyes */}
          <g className="cat__eyes">
            {EYES.map((e, i) => (
              <g key={i}>
                <ellipse cx={e.cx} cy={e.cy} rx="27" ry="31" fill="#fff" />
                <g ref={(el) => void (pupilRefs.current[i] = el)}>
                  <ellipse cx={e.cx} cy={e.cy} rx="14" ry="21" fill="#2b2140" />
                  <ellipse cx={e.cx} cy={e.cy} rx="5" ry="14" fill="#120c1f" />
                  <circle cx={e.cx + 5} cy={e.cy - 8} r="5" fill="#fff" />
                </g>
              </g>
            ))}
          </g>

          {/* nose */}
          <path d="M187 220 Q200 214 213 220 L200 233 Z" fill="#ff7a93" />

          {/* open mouth (scaled by the lip-sync loop) */}
          <g ref={mouthRef} className="cat__mouth-open">
            <path d="M178 240 Q200 236 222 240 Q222 274 200 276 Q178 274 178 240 Z" fill="#6b1f2e" />
            <ellipse cx="200" cy="266" rx="13" ry="8" fill="#ff7a93" />
          </g>

          {/* closed mouth line */}
          <path
            d="M200 233 Q200 246 186 247 Q176 247 174 240 M200 233 Q200 246 214 247 Q224 247 226 240"
            fill="none"
            stroke="#5b3b2e"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* whiskers */}
          <g stroke="#7a5a48" strokeWidth="2.2" strokeLinecap="round" className="cat__whiskers">
            <path d="M150 238 L66 222 M150 246 L62 248 M152 254 L70 274" />
            <path d="M250 238 L334 222 M250 246 L338 248 M248 254 L330 274" />
          </g>
        </g>

        {/* bow tie — it's a professional interview, after all */}
        <g transform="translate(200 288)">
          <path d="M0 0 L-30 -14 L-30 14 Z" fill="#5b5bd6" />
          <path d="M0 0 L30 -14 L30 14 Z" fill="#5b5bd6" />
          <circle r="7" fill="#4343b8" />
        </g>
      </svg>

      {/* status decorations */}
      <div className="cat__thought" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="cat__waves" aria-hidden>
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
