import { useId, type ReactNode } from "react";
import { cn } from "@/lib/logic";
import type { Course } from "@/lib/types";

const w = (o: number) => `rgb(255 255 255 / ${o})`;
const k = (o: number) => `rgb(8 8 12 / ${o})`;
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function WebArt() {
  const r = rng(11);
  const tokens = ["<main>", "{ }", "=>", "GET /api", "200 OK", "</div>", "flex", "grid", "useState", "fetch()", "async", ":root", "<nav>", "404", "JSON", "PATCH", "<h1>", "map()"];
  return (
    <>
      {tokens.map((t, i) => (
        <text key={i} x={40 + r() * 1100} y={60 + r() * 520} fill={w(0.08 + r() * 0.1)} fontFamily={MONO} fontSize={18 + r() * 14}>
          {t}
        </text>
      ))}
      <text x="70" y="430" fill={w(0.1)} fontFamily={MONO} fontSize="150" fontWeight="600">
        {"</>"}
      </text>
      <rect x="330" y="120" width="420" height="290" rx="16" fill={w(0.06)} stroke={w(0.22)} strokeWidth="2" />
      <g>
        <rect x="400" y="160" width="400" height="300" rx="16" fill={k(0.22)} stroke={w(0.6)} strokeWidth="2.5" />
        <path d="M400 194h400" stroke={w(0.35)} strokeWidth="2" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={424 + i * 18} cy="177" r="5.5" fill={w(i === 0 ? 0.9 : 0.45)} />
        ))}
        <rect x="490" y="168" width="220" height="18" rx="9" fill={w(0.16)} />
        <text x="504" y="181" fill={w(0.7)} fontFamily={MONO} fontSize="11">
          muse.local/reading-list
        </text>
        <rect x="420" y="212" width="360" height="22" rx="6" fill={w(0.55)} />
        <rect x="420" y="246" width="88" height="194" rx="8" fill={w(0.16)} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="432" y={262 + i * 30} width={i === 1 ? 64 : 52} height="9" rx="4.5" fill={w(i === 1 ? 0.8 : 0.35)} />
        ))}
        {[0, 1].map((row) =>
          [0, 1].map((col) => (
            <g key={`${row}-${col}`}>
              <rect x={522 + col * 132} y={246 + row * 100} width="122" height="90" rx="10" fill={w(row === 0 && col === 0 ? 0.42 : 0.22)} />
              <rect x={534 + col * 132} y={300 + row * 100} width="70" height="8" rx="4" fill={w(0.6)} />
              <rect x={534 + col * 132} y={316 + row * 100} width="46" height="8" rx="4" fill={w(0.3)} />
            </g>
          )),
        )}
      </g>
      <g>
        <rect x="700" y="330" width="330" height="170" rx="14" fill={k(0.55)} stroke={w(0.35)} strokeWidth="2" />
        {[
          ["$ npm run dev", 0.85],
          ["ready on http://localhost:3000", 0.55],
          ["GET  /api/books      200  12ms", 0.7],
          ["POST /api/books      201  31ms", 0.9],
        ].map(([line, o], i) => (
          <text key={i} x="722" y={372 + i * 30} fill={w(o as number)} fontFamily={MONO} fontSize="15">
            {line as string}
          </text>
        ))}
        <rect x="722" y="470" width="10" height="16" fill={w(0.85)} />
      </g>
    </>
  );
}

function AlgArt() {
  const r = rng(7);
  const path: [number, number][] = [
    [110, 430],
    [290, 340],
    [460, 380],
    [600, 260],
    [745, 320],
    [905, 200],
    [1090, 250],
  ];
  const others: [number, number][] = Array.from({ length: 22 }, () => [40 + r() * 1120, 60 + r() * 480] as [number, number]).filter(([x, y]) => Math.hypot(x - 600, y - 300) > 120);
  const all = [...path, ...others];
  const edges: [number, number][] = [];
  all.forEach((a, i) => {
    const near = all
      .map((b, j) => ({ j, d: Math.hypot(a[0] - b[0], a[1] - b[1]) }))
      .filter((x) => x.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    near.forEach(({ j }) => edges.push([i, j]));
  });
  const weights = [4, 2, 7, 3, 5, 1];
  return (
    <>
      {Array.from({ length: 30 }, (_, i) => (
        <rect key={i} x={i * 40 + 6} y={600 - (24 + i * 6.5)} width="28" height={24 + i * 6.5} rx="3" fill={w(0.05)} />
      ))}
      {edges.map(([a, b], i) => (
        <line key={i} x1={all[a][0]} y1={all[a][1]} x2={all[b][0]} y2={all[b][1]} stroke={w(0.16)} strokeWidth="2" />
      ))}
      {path.slice(1).map(([x, y], i) => {
        const [px, py] = path[i];
        return (
          <g key={i}>
            <line x1={px} y1={py} x2={x} y2={y} stroke={w(0.92)} strokeWidth="5" strokeLinecap="round" />
            <circle cx={(px + x) / 2} cy={(py + y) / 2 - 22} r="15" fill={k(0.35)} stroke={w(0.5)} />
            <text x={(px + x) / 2} y={(py + y) / 2 - 17} textAnchor="middle" fill={w(0.95)} fontFamily={MONO} fontSize="15" fontWeight="600">
              {weights[i]}
            </text>
          </g>
        );
      })}
      {others.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="8" fill={k(0.2)} stroke={w(0.45)} strokeWidth="2" />
      ))}
      {path.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === 3 ? 26 : 13} fill={i === 3 ? w(0.95) : w(0.9)} />
          {i === 3 && <circle cx={x} cy={y} r="40" fill="none" stroke={w(0.35)} strokeWidth="2" />}
          {i === 3 && (
            <text x={x} y={y + 6} textAnchor="middle" fill={k(0.85)} fontFamily={MONO} fontSize="17" fontWeight="700">
              s
            </text>
          )}
        </g>
      ))}
      <text x="60" y="80" fill={w(0.3)} fontFamily={MONO} fontSize="20">
        dist[v] = min(dist[v], dist[u] + w)
      </text>
      <text x="840" y="540" fill={w(0.3)} fontFamily={MONO} fontSize="22">
        O((V + E) log V)
      </text>
    </>
  );
}

function MlArt() {
  const r = rng(23);
  const boundary = (x: number) => 300 + 130 * Math.sin((x / 1200) * Math.PI * 1.8 + 0.4);
  const pts = Array.from({ length: 90 }, () => {
    const x = 20 + r() * 1160;
    const y = 30 + r() * 540;
    return { x, y, a: y < boundary(x) };
  }).filter((p) => Math.abs(p.y - boundary(p.x)) > 26 && !(p.x > 410 && p.x < 790 && p.y > 110 && p.y < 490));
  const d = Array.from({ length: 61 }, (_, i) => {
    const x = i * 20;
    return `${i ? "L" : "M"}${x} ${boundary(x).toFixed(1)}`;
  }).join(" ");
  const layers = [4, 6, 6, 3];
  const xs = [470, 563, 656, 749];
  const node = (l: number, n: number) => [xs[l], 300 + (n - (layers[l] - 1) / 2) * 52] as const;
  return (
    <>
      <path d={d} fill="none" stroke={w(0.55)} strokeWidth="3" strokeDasharray="10 8" />
      <path d={d} fill="none" stroke={w(0.1)} strokeWidth="60" />
      {pts.map((p, i) =>
        p.a ? (
          <circle key={i} cx={p.x} cy={p.y} r="7" fill="none" stroke={w(0.5)} strokeWidth="2.5" />
        ) : (
          <g key={i} stroke={w(0.4)} strokeWidth="2.5" strokeLinecap="round">
            <line x1={p.x - 6} y1={p.y - 6} x2={p.x + 6} y2={p.y + 6} />
            <line x1={p.x + 6} y1={p.y - 6} x2={p.x - 6} y2={p.y + 6} />
          </g>
        ),
      )}
      <rect x="420" y="118" width="380" height="364" rx="26" fill={k(0.3)} stroke={w(0.25)} strokeWidth="2" />
      {layers.slice(0, -1).map((count, l) =>
        Array.from({ length: count }, (_, a) =>
          Array.from({ length: layers[l + 1] }, (_, b) => {
            const [x1, y1] = node(l, a);
            const [x2, y2] = node(l + 1, b);
            return <line key={`${l}-${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={w((a + b) % 3 === 0 ? 0.45 : 0.15)} strokeWidth={(a + b) % 3 === 0 ? 2 : 1.2} />;
          }),
        ),
      )}
      {layers.map((count, l) =>
        Array.from({ length: count }, (_, n) => {
          const [x, y] = node(l, n);
          const out = l === layers.length - 1;
          return <circle key={`${l}-${n}`} cx={x} cy={y} r="13" fill={out ? w(0.95) : k(0.45)} stroke={w(0.9)} strokeWidth="2.5" />;
        }),
      )}
      <text x="440" y="152" fill={w(0.55)} fontFamily={MONO} fontSize="14">
        loss 0.214
      </text>
      <text x="690" y="152" fill={w(0.55)} fontFamily={MONO} fontSize="14">
        F1 0.87
      </text>
    </>
  );
}

function HciArt() {
  return (
    <>
      {[
        [70, 90],
        [960, 430],
        [1040, 70],
        [150, 470],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={60 + i * 14} fill="none" stroke={w(0.08)} strokeWidth="2" />
      ))}
      <g transform="rotate(-7 360 300)">
        <rect x="295" y="175" width="135" height="250" rx="20" fill={w(0.08)} stroke={w(0.4)} strokeWidth="2" />
        <rect x="312" y="200" width="101" height="70" rx="6" fill="none" stroke={w(0.4)} strokeWidth="2" />
        <path d="M312 200l101 70M413 200l-101 70" stroke={w(0.3)} strokeWidth="2" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="312" y={288 + i * 22} width={i % 2 ? 70 : 100} height="9" rx="4.5" fill={w(0.3)} />
        ))}
      </g>
      <path d="M430 230 C 470 200, 490 200, 512 215" fill="none" stroke={w(0.6)} strokeWidth="2.5" strokeDasharray="7 7" />
      <path d="M506 208l10 8-12 4" fill="none" stroke={w(0.6)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <g>
        <rect x="515" y="95" width="175" height="350" rx="30" fill={k(0.25)} stroke={w(0.85)} strokeWidth="3" />
        <rect x="575" y="108" width="55" height="10" rx="5" fill={w(0.5)} />
        <rect x="533" y="134" width="139" height="22" rx="6" fill={w(0.55)} />
        <rect x="533" y="168" width="139" height="96" rx="10" fill={w(0.2)} />
        <path d="M541 252l34-40 22 24 18-16 48 32z" fill={w(0.45)} />
        <circle cx="648" cy="190" r="9" fill={w(0.6)} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="533" y={280 + i * 20} width={i === 2 ? 90 : 139} height="9" rx="4.5" fill={w(0.38)} />
        ))}
        <rect x="533" y="352" width="139" height="38" rx="19" fill={w(0.92)} />
        <text x="602" y="377" textAnchor="middle" fill={k(0.8)} fontFamily={MONO} fontSize="14" fontWeight="700">
          Continue
        </text>
        <circle cx="640" cy="372" r="26" fill="none" stroke={w(0.6)} strokeWidth="2" />
        <circle cx="640" cy="372" r="42" fill="none" stroke={w(0.3)} strokeWidth="2" />
        <path d="M646 378l0 44 11-11 9 20 9-4-9-19 16-1z" fill={w(0.98)} stroke={k(0.6)} strokeWidth="2" strokeLinejoin="round" />
      </g>
      <path d="M700 250 C 740 230, 760 230, 790 246" fill="none" stroke={w(0.6)} strokeWidth="2.5" strokeDasharray="7 7" />
      <path d="M784 238l10 9-13 3" fill="none" stroke={w(0.6)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {[
        [800, 170, 6, 0.92, "Why here?"],
        [905, 250, -5, 0.8, "Too slow"],
        [815, 300, -3, 0.7, "Love this"],
      ].map(([x, y, rot, o, label], i) => (
        <g key={i} transform={`rotate(${rot} ${(x as number) + 55} ${(y as number) + 55})`}>
          <rect x={x as number} y={y as number} width="110" height="110" rx="6" fill={w(o as number)} />
          <text x={(x as number) + 14} y={(y as number) + 34} fill={k(0.75)} fontFamily={MONO} fontSize="15" fontWeight="600">
            {label as string}
          </text>
          <rect x={(x as number) + 14} y={(y as number) + 52} width="70" height="6" rx="3" fill={k(0.25)} />
          <rect x={(x as number) + 14} y={(y as number) + 66} width="50" height="6" rx="3" fill={k(0.25)} />
        </g>
      ))}
    </>
  );
}

function DsArt() {
  const r = rng(31);
  const pts = Array.from({ length: 70 }, () => {
    const x = 30 + r() * 1140;
    const y = 470 - x * 0.3 + (r() - 0.5) * 140;
    return { x, y };
  }).filter((p) => !(p.x > 395 && p.x < 805 && p.y > 105 && p.y < 455));
  const bars = Array.from({ length: 15 }, (_, i) => {
    const z = (i - 7) / 2.6;
    return Math.exp(-z * z / 2);
  });
  const curve = Array.from({ length: 61 }, (_, i) => {
    const x = 430 + i * 5.67;
    const z = ((x - 430) / 340 - 0.5) * 5.8;
    return `${i ? "L" : "M"}${x.toFixed(1)} ${(400 - 230 * Math.exp(-z * z / 2)).toFixed(1)}`;
  }).join(" ");
  return (
    <>
      <path d="M40 560H1160M40 560V40" stroke={w(0.18)} strokeWidth="2" />
      {Array.from({ length: 23 }, (_, i) => (
        <line key={i} x1={40 + i * 50} y1="560" x2={40 + i * 50} y2="570" stroke={w(0.18)} strokeWidth="2" />
      ))}
      <line x1="20" y1="476" x2="1180" y2="122" stroke={w(0.5)} strokeWidth="3" strokeDasharray="12 9" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="6" fill={w(0.3)} />
      ))}
      <rect x="400" y="110" width="400" height="340" rx="22" fill={k(0.28)} stroke={w(0.3)} strokeWidth="2" />
      {bars.map((h, i) => (
        <rect key={i} x={432 + i * 23} y={400 - h * 220} width="18" height={h * 220} rx="3" fill={w(i === 9 ? 0.95 : 0.5)} />
      ))}
      <path d={curve} fill="none" stroke={w(0.95)} strokeWidth="3" />
      <line x1="424" y1="402" x2="776" y2="402" stroke={w(0.6)} strokeWidth="2" />
      <text x="424" y="146" fill={w(0.7)} fontFamily={MONO} fontSize="15">
        trips per hour
      </text>
      <text x="676" y="146" fill={w(0.9)} fontFamily={MONO} fontSize="15" fontWeight="600">
        r = 0.82
      </text>
      <text x="430" y="432" fill={w(0.45)} fontFamily={MONO} fontSize="13">
        n = 12,480
      </text>
      <text x="660" y="432" fill={w(0.45)} fontFamily={MONO} fontSize="13">
        p = 0.003
      </text>
    </>
  );
}

function DefaultArt() {
  return (
    <>
      {[140, 220, 300].map((rad, i) => (
        <circle key={i} cx="600" cy="300" r={rad} fill="none" stroke={w(0.15 - i * 0.03)} strokeWidth="2" />
      ))}
    </>
  );
}

const ART: Record<string, () => ReactNode> = {
  "c-web": WebArt,
  "c-alg": AlgArt,
  "c-ml": MlArt,
  "c-hci": HciArt,
  "c-ds": DsArt,
};

export function CourseCover({ course, className, fadeLeft }: { course: Pick<Course, "id" | "color">; className?: string; fadeLeft?: boolean }) {
  const id = useId().replace(/:/g, "");
  const Art = ART[course.id] ?? DefaultArt;
  return (
    <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden className={cn("absolute inset-0 h-full w-full", className)}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: `color-mix(in oklab, ${course.color} 55%, #07070a)` }} />
          <stop offset="0.55" style={{ stopColor: course.color }} />
          <stop offset="1" style={{ stopColor: `color-mix(in oklab, ${course.color} 78%, #ffffff)` }} />
        </linearGradient>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.25" stopColor="#000" />
          <stop offset="0.7" stopColor="#fff" />
        </linearGradient>
        <mask id={`m${id}`}>
          <rect width="1200" height="600" fill={`url(#f${id})`} />
        </mask>
        <radialGradient id={`r${id}`} cx="0.5" cy="0.42" r="0.55">
          <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="600" fill={`url(#g${id})`} />
      <rect width="1200" height="600" fill={`url(#r${id})`} />
      <g mask={fadeLeft ? `url(#m${id})` : undefined}>
        <Art />
      </g>
    </svg>
  );
}
