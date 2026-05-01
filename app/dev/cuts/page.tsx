"use client";

import { CutSelectionScreen } from "@/components/cuts/CutSelectionScreen";
import type { GeneratedAnimalId } from "@/lib/generated/cutProfiles";
import { useState } from "react";

const animals: Array<{ id: GeneratedAnimalId; label: string }> = [
  { id: "beef", label: "Vacuno" },
  { id: "pork", label: "Cerdo" },
  { id: "chicken", label: "Pollo" },
  { id: "fish", label: "Pescado" },
  { id: "vegetables", label: "Verduras" },
];

export default function DevCutsPage() {
  const [animal, setAnimal] = useState<GeneratedAnimalId>("beef");

  return (
    <div className="min-h-screen bg-[#030201]">
      <div className="fixed inset-x-0 top-0 z-[60] border-b border-white/10 bg-black/50 px-3 py-2 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          {animals.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAnimal(item.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${
                animal === item.id
                  ? "border-orange-400 bg-orange-500 text-black"
                  : "border-white/10 bg-white/[0.06] text-zinc-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-12">
        <CutSelectionScreen selectedAnimal={animal} />
      </div>
    </div>
  );
}
