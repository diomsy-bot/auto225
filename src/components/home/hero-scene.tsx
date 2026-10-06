"use client";

import { useEffect, useRef, useState } from "react";

type Props = { videoUrl?: string | null; posterUrl?: string | null };

/**
 * Décor animé inspiré d'Abidjan (lagune, Plateau, pont à haubans) avec des voitures qui roulent.
 * Boucle de 8 s en SVG/CSS (quelques Ko). Si une vidéo est configurée dans l'administration,
 * elle remplace le décor, sauf en cas de connexion lente, d'échec ou de réduction des mouvements.
 */
export function HeroScene({ videoUrl, posterUrl }: Props) {
  const [paused, setPaused] = useState(false);
  const [useVideo, setUseVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = connection?.saveData || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");
    if (reduce.matches) setPaused(true);
    if (videoUrl && !reduce.matches && !slow) setUseVideo(true);
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else video.play().catch(() => setUseVideo(false));
  }, [paused, useVideo]);

  return (
    <div className={`hero-scene absolute inset-0 overflow-hidden ${paused ? "is-paused" : ""}`} aria-hidden="false">
      {useVideo && videoUrl ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={videoUrl}
          poster={posterUrl ?? undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          onError={() => setUseVideo(false)}
          aria-hidden="true"
        />
      ) : (
        <AbidjanScene />
      )}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="absolute bottom-3 right-3 z-20 inline-flex min-h-10 items-center gap-2 rounded-full bg-white/90 px-4 text-xs font-semibold text-ink shadow focus-visible:outline-3 focus-visible:outline-brand-orange"
        aria-pressed={paused}
      >
        {paused ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg>
            Lire l&apos;animation
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" /></svg>
            Mettre en pause
          </>
        )}
      </button>
    </div>
  );
}

function Car({ color, accent = "#1b2421", flip = false }: { color: string; accent?: string; flip?: boolean }) {
  return (
    <g transform={flip ? "scale(-1,1)" : undefined}>
      <path d="M8 34 C10 22 22 20 36 18 L56 6 C62 3 92 2 104 6 L126 18 C140 20 150 24 152 34 L152 40 L8 40 Z" fill={color} />
      <path d="M60 9 C66 7 90 7 100 9 L116 19 L48 19 Z" fill="#cfe3f2" opacity="0.9" />
      <rect x="80" y="8" width="3" height="11" fill={color} />
      <rect x="140" y="26" width="10" height="4" rx="2" fill="#ffd166" />
      <rect x="8" y="27" width="7" height="4" rx="2" fill="#e63946" />
      <circle cx="42" cy="40" r="11" fill={accent} />
      <circle cx="42" cy="40" r="5" fill="#9aa5a0" />
      <circle cx="120" cy="40" r="11" fill={accent} />
      <circle cx="120" cy="40" r="5" fill="#9aa5a0" />
    </g>
  );
}

function Palm({ x, h = 110 }: { x: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${330 - h})`} className="palm">
      <path d={`M0 ${h} C4 ${h * 0.6} -2 ${h * 0.3} 4 0`} stroke="#3d4f3a" strokeWidth="6" fill="none" />
      <g fill="#0d6b35">
        <path d="M4 0 C-20 -6 -40 4 -52 18 C-32 6 -16 6 4 4 Z" />
        <path d="M4 0 C26 -8 46 2 58 16 C38 6 22 6 4 4 Z" />
        <path d="M4 0 C-6 -20 -24 -30 -40 -30 C-22 -22 -10 -12 4 2 Z" />
        <path d="M4 0 C14 -22 32 -30 46 -28 C30 -20 18 -10 4 2 Z" />
      </g>
    </g>
  );
}

function AbidjanScene() {
  const towers = [
    [520, 120, 60], [585, 170, 44], [635, 95, 52], [692, 210, 38], [735, 140, 56], [796, 185, 42], [842, 115, 50], [898, 160, 40],
  ];
  return (
    <svg className="h-full w-full" viewBox="0 0 1600 500" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Voitures roulant au bord de la lagune Ébrié, à Abidjan">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdf3e7" />
          <stop offset="0.6" stopColor="#fde2c8" />
          <stop offset="1" stopColor="#fbd0ac" />
        </linearGradient>
        <linearGradient id="lagoon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc3c4" />
          <stop offset="1" stopColor="#3f9aa0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="500" fill="url(#sky)" />
      <circle cx="1220" cy="150" r="70" fill="#fdb46b" opacity="0.55" />

      {/* Plateau */}
      <g fill="#b9c7c1">
        {towers.map(([x, h, w]) => (
          <rect key={x} x={x} y={300 - h} width={w} height={h} />
        ))}
        <path d="M955 300 L1000 150 L1045 300 Z" />
      </g>
      <g fill="#ffffff" opacity="0.5">
        {towers.map(([x, h, w]) =>
          Array.from({ length: Math.floor(h / 22) }, (_, i) => (
            <rect key={`${x}-${i}`} x={x + 8} y={300 - h + 10 + i * 22} width={w - 16} height="6" />
          )),
        )}
      </g>

      {/* Pont à haubans */}
      <g stroke="#8a9a93" strokeWidth="3" fill="none">
        <path d="M1260 300 L1330 120 L1400 300" strokeWidth="8" stroke="#a3b2ab" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <line x1="1330" y1={130 + i * 8} x2={1340 + i * 40} y2="268" />
            <line x1="1330" y1={130 + i * 8} x2={1320 - i * 40} y2="268" />
          </g>
        ))}
      </g>
      <rect x="1060" y="266" width="540" height="10" fill="#a3b2ab" />

      {/* Lagune */}
      <rect y="300" width="1600" height="60" fill="url(#lagoon)" />
      <g className="waves" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" fill="none">
        <path d="M0 320 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" />
      </g>

      <Palm x={90} h={130} />
      <Palm x={180} h={100} />
      <Palm x={1500} h={120} />

      {/* Route */}
      <rect y="360" width="1600" height="140" fill="#3a4441" />
      <rect y="356" width="1600" height="6" fill="#e9ecea" />
      <g className="lane">
        {Array.from({ length: 22 }, (_, i) => (
          <rect key={i} x={i * 80} y="428" width="44" height="5" rx="2" fill="#f2f2f2" opacity="0.8" />
        ))}
      </g>

      <g className="car car-1" transform="translate(180 362)"><Car color="#017234" /></g>
      <g className="car car-2" transform="translate(760 362)"><Car color="#fa4705" /></g>
      <g className="car car-3" transform="translate(1260 362)"><Car color="#f4f5f4" accent="#2a2f2d" /></g>
      <g className="car car-4" transform="translate(1100 440)"><Car color="#1f2523" accent="#000" flip /></g>
      <g className="car car-5" transform="translate(420 440)"><Car color="#0e8c45" flip /></g>
    </svg>
  );
}
