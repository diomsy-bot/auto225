"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type Props = { videoUrl?: string | null; posterUrl?: string | null };

// Image d'ambiance par défaut (remplaçable par l'image de couverture saisie dans l'administration).
// L'image locale prend le relais si l'image distante ne se charge pas.
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=2000&q=80";
const FALLBACK_IMAGE = "/demo/flotte.webp";

/**
 * Fond animé de l'accueil : grande photo avec un lent mouvement de caméra, ou la vidéo configurée
 * dans l'administration (sauf connexion lente, échec ou réduction des mouvements). Bouton pause.
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

  const image = posterUrl || DEFAULT_IMAGE;

  return (
    <div className={`hero-scene absolute inset-0 overflow-hidden rounded-[inherit] bg-[#152b22] ${paused ? "is-paused" : ""}`}>
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
        <div
          className="hero-media absolute inset-0 bg-cover bg-[position:60%_center] sm:bg-[position:center_59%]"
          style={{ backgroundImage: `url("${image}"), url("${FALLBACK_IMAGE}")` }}
          role="img"
          aria-label="Véhicule sur la route — image d'ambiance"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#092318e8,#09231894)] sm:bg-[linear-gradient(90deg,rgba(9,26,19,.91),rgba(9,26,19,.57)_47%,rgba(9,26,19,.04))]" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="absolute top-4 right-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 focus-visible:outline-3 focus-visible:outline-brand-orange sm:top-6 sm:right-7"
        aria-pressed={paused}
        aria-label={paused ? "Lire l'animation" : "Mettre en pause"}
        title={paused ? "Lire l'animation" : "Mettre en pause"}
      >
        {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
      </button>
    </div>
  );
}
