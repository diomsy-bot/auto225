"use client";

import Image from "next/image";
import { useState } from "react";
import type { VehiclePhoto } from "@prisma/client";
import { VehicleImage } from "./vehicle-image";

export function VehicleGallery({ photos, name, isDemo }: { photos: VehiclePhoto[]; name: string; isDemo: boolean }) {
  const [index, setIndex] = useState(0);
  const current = photos[index];
  return (
    <div>
      <VehicleImage src={current?.url} alt={current?.alt || name} isDemo={isDemo} className="aspect-[16/10] rounded-2xl" priority />
      {photos.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto" aria-label="Photos du véhicule">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Afficher la photo ${i + 1}`}
                aria-current={i === index}
                className={`relative block h-16 w-24 overflow-hidden rounded-lg ring-2 ${i === index ? "ring-brand-orange" : "ring-transparent"}`}
              >
                <Image src={p.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
